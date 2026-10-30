import { connectDB } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import { loadCatalog } from "@/lib/catalog";

// Reads live data from the database on every request. Marked dynamic so a
// build never depends on reaching the database — a transient Atlas blip
// should not fail a deploy.
export const dynamic = "force-dynamic";

// GET /api/catalog — full category tree (categories with their subcategories).
export async function GET() {
  try {
    await connectDB();
    const res = ok(await loadCatalog());

    // The category tree and the post fee change about as often as the price
    // list does, but four pages ask for this and `force-dynamic` otherwise
    // means every one of those visits runs three queries. Caching the response
    // rather than removing `force-dynamic` keeps the deploy-safety above while
    // letting the CDN absorb the repeat traffic.
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res;
  } catch (err) {
    return fail(`Failed to load catalog: ${err.message}`, 500);
  }
}
