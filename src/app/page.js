import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const FEATURES = [
  {
    title: "List for free or pay-to-list",
    body: "Eligible high-value, single-unit listings go commission-only (Model A). Everything else is a simple paid listing (Model B).",
  },
  {
    title: "Token-fee contact unlock",
    body: "Buyers pay a small, non-refundable token to reveal verified owner contact and the exact item location — protecting owner privacy.",
  },
  {
    title: "Verified & accountable",
    body: "Admin-verified ownership, immutable access logs, automatic commission and penalty enforcement keep every deal honest.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find the real owner.
            <span className="text-brand"> Skip the brokers.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            getownerinfo connects serious buyers and tenants directly with verified
            owners across real estate, vehicles, furniture and more — with privacy and
            trust built in.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              List your property
            </Link>
            <Link href="/listings" className="btn-outline px-6 py-3 text-base">
              Browse listings
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-slate-500">
          <div className="mb-2 flex justify-center gap-4">
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link href="/cookies" className="hover:text-slate-700">Cookie preferences</Link>
          </div>
          © {new Date().getFullYear()} getownerinfo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
