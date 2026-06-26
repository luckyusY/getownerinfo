import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import TokenUnlock from "@/models/TokenUnlock";
import { getSession } from "@/lib/auth";
import { buildRevealedContact } from "@/lib/unlockService";
import { ok, fail } from "@/lib/api";
import { ROLES, LISTING_STATUS } from "@/lib/constants";

// GET /api/listings/:id — role-aware view.
//   - owner of the listing, admin, assigned manager -> full (incl. proof for admin)
//   - everyone else -> public masked view (contact + exact location hidden)
// NOTE: buyer unlock (revealing gated fields after token payment) lands in Phase 4.
export async function GET(_req, { params }) {
  await connectDB();
  const listing = await Listing.findById(params.id);
  if (!listing) return fail("Listing not found", 404);

  const session = getSession();
  const isAdmin = session?.role === ROLES.ADMIN;
  const isOwner = session && listing.owner.toString() === session.sub;
  const isAssignedManager =
    session?.role === ROLES.MANAGER &&
    listing.assignedManager?.toString() === session.sub;

  if (isAdmin || isOwner || isAssignedManager) {
    return ok({ listing: listing.toFullJSON({ includeProof: isAdmin || isAssignedManager }) });
  }

  // Public can only see active listings.
  if (listing.status !== LISTING_STATUS.ACTIVE) {
    return fail("Listing not available", 404);
  }

  // A signed-in buyer who has unlocked this listing sees the revealed fields
  // (watermarked), but never the ownership proof.
  if (session) {
    const unlock = await TokenUnlock.findOne({ user: session.sub, listing: listing._id });
    if (unlock) {
      return ok({
        listing: { ...listing.toPublicJSON(), contactLocked: false },
        revealed: buildRevealedContact(listing, unlock.watermark),
      });
    }
  }

  return ok({ listing: listing.toPublicJSON() });
}
