import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Subcategory from "@/models/Subcategory";
import { ok, fail } from "@/lib/api";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";

// Reads live data from the database on every request. Marked dynamic so a
// build never depends on reaching the database — a transient Atlas blip
// should not fail a deploy.
export const dynamic = "force-dynamic";

// GET /api/catalog — full category tree (categories with their subcategories).
export async function GET() {
  try {
    await connectDB();
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

    return ok({ categories: tree, seekerPostFee: settings.seeker?.postFee ?? DEFAULT_SETTINGS.seeker.postFee });
  } catch (err) {
    return fail(`Failed to load catalog: ${err.message}`, 500);
  }
}
