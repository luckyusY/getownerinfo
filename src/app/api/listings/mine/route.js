import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";
import { ROLES, SELLER_ROLES } from "@/lib/constants";

// GET /api/listings/mine — the authenticated owner's own listings (full view).
export async function GET() {
  const guard = requireAuth([...SELLER_ROLES, ROLES.MANAGER, ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const filter = guard.session.role === ROLES.ADMIN
    ? {}
    : guard.session.role === ROLES.MANAGER
      ? { assignedManager: guard.session.sub }
      : { owner: guard.session.sub };
  const listings = await Listing.find(filter).sort({ createdAt: -1 });
  return ok({ listings: listings.map((l) => l.toFullJSON({ includeProof: true })) });
}
