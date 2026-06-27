import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import Listing from "@/models/Listing";
import { ok, fail, requireAuth } from "@/lib/api";

// POST /api/favorites/:listingId — toggle a favorite. Returns { favorited }.
export async function POST(_req, { params }) {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const listing = await Listing.findById(params.listingId).select("_id");
  if (!listing) return fail("Listing not found", 404);

  const existing = await Favorite.findOne({ user: guard.session.sub, listing: listing._id });
  if (existing) {
    await existing.deleteOne();
    return ok({ favorited: false });
  }
  await Favorite.create({ user: guard.session.sub, listing: listing._id });
  return ok({ favorited: true });
}
