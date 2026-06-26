import { z } from "zod";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { audit } from "@/models/AuditLog";
import { ok, fail, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS } from "@/lib/constants";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

// POST /api/listings/:id/moderate — admin approves or rejects a pending listing.
export async function POST(req, { params }) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("action must be 'approve' or 'reject'", 422);

  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);
  if (listing.status !== LISTING_STATUS.PENDING_APPROVAL) {
    return fail(`Listing is '${listing.status}', not pending approval`, 409);
  }

  if (parsed.data.action === "approve") {
    listing.status = LISTING_STATUS.ACTIVE;
    listing.rejectionReason = undefined;
  } else {
    listing.status = LISTING_STATUS.REJECTED;
    listing.rejectionReason = parsed.data.reason || "Rejected by admin";
  }
  await listing.save();

  await audit({
    actor: guard.session.sub,
    actorRole: guard.session.role,
    action: `listing.${parsed.data.action}`,
    targetType: "Listing",
    targetId: listing._id,
    meta: { reason: parsed.data.reason },
  });

  return ok({ listing: listing.toFullJSON({ includeProof: true }) });
}
