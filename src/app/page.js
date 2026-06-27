import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PropertyCard from "@/components/PropertyCard";
import HeroSlider from "@/components/HeroSlider";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import { LISTING_STATUS } from "@/lib/constants";
import { BriefcaseBusiness, Car, Handshake, Home, KeyRound, Refrigerator, SearchCheck, ShieldCheck, Sofa, Store } from "lucide-react";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: SearchCheck, title: "Browse verified listings", body: "Property, vehicles and assets across Rwanda, with every owner verified by our team." },
  { icon: KeyRound, title: "Unlock with a token", body: "Pay a small, non-refundable fee to reveal the owner's contact and exact location." },
  { icon: Handshake, title: "Deal directly", body: "Call the owner, view, and negotiate. No brokers, no inflated middle-man fees." },
];

const CATEGORIES = [
  { label: "Real Estate", slug: "real-estate", icon: Home },
  { label: "Vehicles", slug: "vehicles", icon: Car },
  { label: "Furniture", slug: "home-office-furniture", icon: Sofa },
  { label: "Appliances", slug: "home-appliances", icon: Refrigerator },
  { label: "Made in Rwanda", slug: "made-in-rwanda", icon: Store },
  { label: "Business", slug: "business-industry", icon: BriefcaseBusiness },
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
        <HeroSlider />

        <section className="mx-auto -mt-8 max-w-6xl px-4 pb-8" data-reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
              <Link
                key={c.slug}
                href={`/listings?category=${c.slug}`}
                className="category-tile premium-hover"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-ink">{c.label}</span>
              </Link>
              );
            })}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-8" data-reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-bold text-ink">Featured listings</h2>
                <p className="mt-1 text-ink-soft">Fresh, verified properties and assets.</p>
              </div>
              <Link href="/listings" className="btn-outline">View all</Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => <PropertyCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}

        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16" data-reveal>
          <h2 className="font-display text-3xl font-bold text-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
              <div key={s.title} className="card premium-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4" data-reveal>
          <div className="grid gap-6 rounded-xl bg-ink p-6 text-white shadow-lift sm:grid-cols-3">
            {[
              [ShieldCheck, "Verified owners", "Every listing is checked by our team before it goes live."],
              [KeyRound, "Private by design", "Contact details stay hidden until a buyer pays the token fee."],
              [Handshake, "Accountable deals", "Immutable access logs and automatic commission enforcement."],
            ].map(([Icon, t, b]) => (
              <div key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                <p className="font-display text-lg font-semibold text-white">{t}</p>
                <p className="mt-1 text-sm text-white/75">{b}</p>
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
