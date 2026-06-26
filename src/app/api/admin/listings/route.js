import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { ok, requireAuth } from "@/lib/api";
import { ROLES, LISTING_STATUS } from "@/lib/constants";

// GET /api/admin/listings?status=pending_approval — moderation queue (admin).
export async function GET(req) {
  const guard = requireAuth([ROLES.ADMIN]);
  if (guard.error) return guard.error;

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || LISTING_STATUS.PENDING_APPROVAL;

  const listings = await Listing.find({ status })
    .populate("owner", "name email")
    .sort({ createdAt: 1 });

  return ok({
    listings: listings.map((l) => ({
      ...l.toFullJSON({ includeProof: true }),
      ownerName: l.owner?.name,
      ownerEmail: l.owner?.email,
    })),
  });
}
