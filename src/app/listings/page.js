import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectDB } from "@/lib/db";
import { loadCatalog } from "@/lib/catalog";
import ListingsExplorer from "./ListingsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse listings",
  description: "Browse reviewed property, vehicles and assets across Rwanda. Unlock owner contact with a token fee.",
};

export default async function ListingsPage({ searchParams }) {
  // The explorer used to ask for this from a useEffect, so the filters only
  // became usable after the page had rendered, shipped its JS and hydrated.
  // Reading it here puts the categories in the first HTML response instead.
  //
  // Falling back to null rather than failing the page keeps the old behaviour
  // when the database is unreachable: the explorer then fetches /api/catalog
  // itself, exactly as it did before.
  let catalog = null;
  try {
    await connectDB();
    catalog = await loadCatalog();
  } catch {
    catalog = null;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <section className="page-hero">
          <p className="eyebrow">Marketplace</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Browse listings</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Explore property, vehicles, and assets. Contact details and exact location unlock with a token fee.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/listings" className="btn-primary">Browse listings</Link>
            <Link href="/seekers/new" className="btn-outline">Post what you need</Link>
            <Link href="/register?role=owner" className="btn-outline">List your property</Link>
          </div>
        </section>
        <div className="mt-6">
          <ListingsExplorer
            initialCategory={searchParams?.category || ""}
            initialLocation={searchParams?.location || ""}
            initialQuery={searchParams?.q || ""}
            initialCategories={catalog?.categories || null}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
