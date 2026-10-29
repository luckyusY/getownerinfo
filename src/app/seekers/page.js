import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeekersBrowse from "./SeekersBrowse";

export const metadata = {
  title: "Seeker requests",
  description: "Buyers and tenants looking for property and assets. Unlock seeker contact with a view token.",
};

export default function SeekersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="page-shell">
        <section className="page-hero">
          <p className="eyebrow">Seekers</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink">Requests from seekers</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Buyers and tenants looking for property and assets. Unlock contact with a view token.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/seekers/new" className="btn-primary">Post a request</Link>
            <Link href="/listings" className="btn-outline">Browse listings</Link>
          </div>
        </section>
        <div className="mt-6">
          <SeekersBrowse />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
