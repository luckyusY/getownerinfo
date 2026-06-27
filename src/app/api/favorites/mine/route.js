import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import { ok, requireAuth } from "@/lib/api";
import { LISTING_STATUS } from "@/lib/constants";

// GET /api/favorites/mine — the user's saved listings (active only), card shape.
export async function GET() {
  const guard = requireAuth();
  if (guard.error) return guard.error;

  await connectDB();
  const favorites = await Favorite.find({ user: guard.session.sub })
    .sort({ createdAt: -1 })
    .populate({ path: "listing", model: Listing })
    .lean();

  const categories = await Category.find({}).select("name").lean();
  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

  const listings = favorites
    .map((f) => f.listing)
    .filter((l) => l && l.status === LISTING_STATUS.ACTIVE)
    .map((l) => ({
      id: l._id.toString(),
      title: l.title,
      images: (l.images || []).map((m) => m.url),
      price: l.price,
      transactionType: l.transactionType,
      model: l.model,
      location: { area: l.location?.area || null },
      categoryName: catName[l.category?.toString()] || "Listing",
    }));

  return ok({ listings });
}
