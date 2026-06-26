import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListingsExplorer from "./ListingsExplorer";

export const dynamic = "force-dynamic";

export default function ListingsPage({ searchParams }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-4xl font-semibold text-ink">Browse listings</h1>
        <p className="mt-1 text-ink-soft">
          Contact details and exact location are unlocked with a token fee.
        </p>
        <div className="mt-6">
          <ListingsExplorer initialCategory={searchParams?.category || ""} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
