import { z } from "zod";
import { connectDB } from "@/lib/db";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES } from "@/lib/constants";

const schema = z.object({
  status: z.enum([SEEKER_STATUS.FULFILLED, SEEKER_STATUS.CLOSED, SEEKER_STATUS.REJECTED, SEEKER_STATUS.ACTIVE]),
});

// POST /api/seekers/:id/status — seeker marks fulfilled/closed; admin can reject/reactivate.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.BUYER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid status", 422);

  await connectDB();
  const request = await SeekerRequest.findById(params.id);
  if (!request) return fail("Request not found", 404);

  const isOwner = request.seeker.toString() === guard.session.sub;
  const isAdmin = guard.session.role === ROLES.ADMIN;
  if (!isOwner && !isAdmin) return fail("Forbidden", 403);

  // Only admins may reject or reactivate.
  if ([SEEKER_STATUS.REJECTED, SEEKER_STATUS.ACTIVE].includes(parsed.data.status) && !isAdmin) {
    return fail("Only an admin can set this status", 403);
  }

  request.status = parsed.data.status;
  await request.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: "seeker.status",
    targetType: "SeekerRequest",
    targetId: request._id,
    meta: { status: parsed.data.status },
  });

  return ok({ request: request.toPublicJSON() });
}
