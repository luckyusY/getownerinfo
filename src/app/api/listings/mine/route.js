import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import ListingAgreement from "@/models/ListingAgreement";
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

  // Which of these have a signed agreement on file, so the workspace can offer
  // the copy of it only where there is one to open. A single distinct() over
  // an indexed field, rather than a lookup per listing.
  const ids = listings.map((l) => l._id);
  const withAgreement = new Set(
    (await ListingAgreement.distinct("listing", { listing: { $in: ids } })).map((id) =>
      id.toString()
    )
  );

  return ok({
    listings: listings.map((l) => ({
      ...l.toFullJSON({ includeProof: true }),
      hasAgreement: withAgreement.has(l._id.toString()),
    })),
  });
}
