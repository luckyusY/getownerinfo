import Category from "@/models/Category";
import Subcategory from "@/models/Subcategory";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";

/**
 * The public category tree plus the seeker post fee.
 *
 * Lives here rather than in the route handler because `/listings` renders on
 * the server and needs the same data. It used to reach it by fetching
 * `/api/catalog` from a `useEffect` after hydration, which meant the filters
 * on the main browse page only became usable after a second round trip.
 *
 * Callers must have connected to the database already.
 */
export async function loadCatalog() {
  const [categories, subs, settings] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    Subcategory.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    getSettings(PlatformSettings, DEFAULT_SETTINGS),
  ]);

  const byCategory = subs.reduce((acc, s) => {
    const key = s.category.toString();
    (acc[key] ||= []).push({
      id: s._id.toString(),
      slug: s.slug,
      name: s.name,
      itemTypes: s.itemTypes,
    });
    return acc;
  }, {});

  const tree = categories.map((c) => ({
    id: c._id.toString(),
    slug: c.slug,
    name: c.name,
    transactionTypes: c.transactionTypes,
    modelRule: c.modelRule,
    listingFeeMonthly: c.listingFeeMonthly,
    tokenFee: c.tokenFee,
    commissionPercent: c.commissionPercent,
    subcategories: byCategory[c._id.toString()] || [],
  }));

  return {
    categories: tree,
    seekerPostFee: settings.seeker?.postFee ?? DEFAULT_SETTINGS.seeker.postFee,
  };
}
