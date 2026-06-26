import { connectDB } from "@/lib/db";
import SeekerRequest, { SEEKER_STATUS } from "@/models/SeekerRequest";
import SeekerUnlock from "@/models/SeekerUnlock";
import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export function buildSeekerContact(request, watermark) {
  return {
    watermark,
    contact: {
      name: request.contact?.name,
      phone: request.contact?.phone,
      preferredContactTime: request.contact?.preferredContactTime,
    },
  };
}

// GET /api/seekers/:id — anonymized, or revealed for the seeker/admin/unlocked viewer.
export async function GET(_req, { params }) {
  await connectDB();
  const request = await SeekerRequest.findById(params.id);
  if (!request) return fail("Request not found", 404);

  const session = getSession();
  const isOwner = session && request.seeker.toString() === session.sub;
  const isAdmin = session?.role === ROLES.ADMIN;

  if (isOwner || isAdmin) {
    return ok({ request: { ...request.toPublicJSON(), contactLocked: false }, revealed: buildSeekerContact(request, "owner/admin") });
  }

  if (request.status !== SEEKER_STATUS.ACTIVE || request.expiresAt < new Date()) {
    return fail("Request not available", 404);
  }

  if (session) {
    const unlock = await SeekerUnlock.findOne({ viewer: session.sub, seekerRequest: request._id });
    if (unlock) {
      return ok({ request: { ...request.toPublicJSON(), contactLocked: false }, revealed: buildSeekerContact(request, unlock.watermark) });
    }
  }

  return ok({ request: request.toPublicJSON() });
}
