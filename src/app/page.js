import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const STEPS = [
  { n: "01", title: "Browse verified listings", body: "Property, vehicles and assets across Rwanda — every owner verified by our team." },
  { n: "02", title: "Unlock with a token", body: "Pay a small, non-refundable fee to reveal the owner's contact and exact location." },
  { n: "03", title: "Deal directly", body: "Call the owner, view, and negotiate. No brokers, no inflated middle-man fees." },
];

const CATEGORIES = [
  { label: "Real Estate", slug: "real-estate", emoji: "🏠" },
  { label: "Vehicles", slug: "vehicles", emoji: "🚗" },
  { label: "Furniture", slug: "home-office-furniture", emoji: "🛋️" },
  { label: "Appliances", slug: "home-appliances", emoji: "🧊" },
  { label: "Made in Rwanda", slug: "made-in-rwanda", emoji: "🧺" },
  { label: "Business", slug: "business-industry", emoji: "🏢" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:pt-28">
            <div className="animate-fade-up">
              <span className="badge bg-brand-50 text-brand">Trusted by serious buyers & owners</span>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
                Find the real owner.{" "}
                <span className="text-brand">Skip the brokers.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                getownerinfo connects serious buyers and tenants directly with verified
                owners — property, vehicles and assets — with privacy and trust built in.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary px-6 py-3 text-base">List your property →</Link>
                <Link href="/listings" className="btn-outline px-6 py-3 text-base">Browse listings</Link>
              </div>
            </div>

            {/* Category tiles */}
            <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/listings?category=${c.slug}`}
                  className="card flex flex-col items-center gap-2 !p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-sm font-semibold text-ink">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-3xl font-semibold text-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <span className="font-display text-3xl font-semibold text-brand/30">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="card grid gap-6 bg-brand text-white sm:grid-cols-3">
            {[
              ["Verified owners", "Every listing is checked by our team before it goes live."],
              ["Private by design", "Contact details stay hidden until a buyer pays the token fee."],
              ["Accountable deals", "Immutable access logs and automatic commission enforcement."],
            ].map(([t, b]) => (
              <div key={t}>
                <p className="font-display text-lg font-semibold">{t}</p>
                <p className="mt-1 text-sm text-white/80">{b}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper py-10">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-ink-soft">
          <div className="mb-3 flex justify-center gap-5">
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/cookies" className="hover:text-ink">Cookie preferences</Link>
          </div>
          © {new Date().getFullYear()} getownerinfo. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
