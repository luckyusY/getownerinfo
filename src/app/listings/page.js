import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListingsExplorer from "./ListingsExplorer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse listings",
  description: "Browse verified property, vehicles and assets across Rwanda. Unlock owner contact with a token fee.",
};

export default function ListingsPage({ searchParams }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <section className="page-hero">
          <p className="eyebrow">Marketplace</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Browse verified listings</h1>
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
          <ListingsExplorer initialCategory={searchParams?.category || ""} initialLocation={searchParams?.location || ""} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
