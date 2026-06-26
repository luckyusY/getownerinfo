import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PropertyCard from "@/components/PropertyCard";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import { LISTING_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";

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

async function getFeatured() {
  await connectDB();
  const [listings, categories] = await Promise.all([
    Listing.find({ status: LISTING_STATUS.ACTIVE }).sort({ createdAt: -1 }).limit(6).lean(),
    Category.find({}).lean(),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));
  return listings.map((l) => ({
    id: l._id.toString(),
    title: l.title,
    images: (l.images || []).map((m) => m.url),
    price: l.price,
    transactionType: l.transactionType,
    model: l.model,
    location: { area: l.location?.area || null },
    categoryName: catName[l.category?.toString()] || "Listing",
  }));
}

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
            <div className="animate-fade-up">
              <span className="badge bg-brand-50 text-brand">Trusted by serious buyers &amp; owners</span>
              <h1 className="mt-5 max-w-3xl text-balance font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl">
                Find the real owner. <span className="text-brand">Skip the brokers.</span>
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

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/listings?category=${c.slug}`}
                  className="card flex flex-col items-center gap-2 !p-4 text-center transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-sm font-semibold text-ink">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured listings */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-ink">Featured listings</h2>
                <p className="mt-1 text-ink-soft">Fresh, verified properties and assets.</p>
              </div>
              <Link href="/listings" className="btn-outline">View all →</Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => <PropertyCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card">
                <span className="font-display text-3xl font-bold text-brand/25">{s.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="card grid gap-6 bg-brand text-white sm:grid-cols-3">
            {[
              ["Verified owners", "Every listing is checked by our team before it goes live."],
              ["Private by design", "Contact details stay hidden until a buyer pays the token fee."],
              ["Accountable deals", "Immutable access logs and automatic commission enforcement."],
            ].map(([t, b]) => (
              <div key={t}>
                <p className="font-display text-lg font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-white/80">{b}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
