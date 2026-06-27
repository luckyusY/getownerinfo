import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PropertyCard from "@/components/PropertyCard";
import HeroCarousel from "@/components/HeroCarousel";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import TokenUnlock from "@/models/TokenUnlock";
import { LISTING_STATUS, ROLES } from "@/lib/constants";
import { BriefcaseBusiness, Car, FileCheck2, Fingerprint, Handshake, Home, KeyRound, Lock, Refrigerator, ScrollText, SearchCheck, ShieldCheck, Sofa, Store } from "lucide-react";
import { SAMPLE_LISTINGS } from "@/data/sampleListings";
import { POPULAR_LOCATIONS } from "@/data/locations";

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

const SAFETY = [
  { icon: Fingerprint, title: "Identity verified", body: "Owners submit ID and ownership proof. Our team verifies before a listing goes live." },
  { icon: Lock, title: "Privacy protected", body: "Contact and exact location stay hidden until a buyer pays the token fee." },
  { icon: ScrollText, title: "Immutable access logs", body: "Every unlock is recorded permanently and used to enforce fair commissions." },
  { icon: FileCheck2, title: "Watermarked contacts", body: "Revealed details are stamped with the viewer's identity to deter sharing." },
];

function compact(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
  return String(n);
}

async function getHomeData() {
  await connectDB();
  const [listings, categories, activeCount, ownerCount, unlockCount, catCount] = await Promise.all([
    Listing.find({ status: LISTING_STATUS.ACTIVE }).sort({ createdAt: -1 }).limit(6).lean(),
    Category.find({}).lean(),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
    User.countDocuments({ role: ROLES.OWNER }),
    TokenUnlock.countDocuments({}),
    Category.countDocuments({}),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));
  const idToSlug = Object.fromEntries(categories.map((c) => [c._id.toString(), c.slug]));

  // One real listing photo per category for the category thumbnails.
  const withImg = await Listing.find({ status: LISTING_STATUS.ACTIVE, "images.0": { $exists: true } })
    .select("category images")
    .limit(120)
    .lean();
  const categoryImages = {};
  for (const l of withImg) {
    const slug = idToSlug[l.category?.toString()];
    if (slug && !categoryImages[slug]) categoryImages[slug] = l.images?.[0]?.url;
  }

  const liveListings = listings.map((l) => ({
    id: l._id.toString(),
    title: l.title,
    images: (l.images || []).map((m) => m.url),
    price: l.price,
    transactionType: l.transactionType,
    model: l.model,
    location: { area: l.location?.area || null },
    categoryName: catName[l.category?.toString()] || "Listing",
  }));
  const featured = [...SAMPLE_LISTINGS, ...liveListings].slice(0, 6);
  const stats = [
    { label: "Active listings", value: compact(activeCount) },
    { label: "Verified owners", value: compact(ownerCount) },
    { label: "Contacts unlocked", value: compact(unlockCount) },
    { label: "Categories", value: String(catCount) },
  ];
  return { featured, stats, categoryImages, usingSamples: liveListings.length === 0 };
}

export default async function HomePage() {
  const { featured, stats, categoryImages, usingSamples } = await getHomeData();

  const heroSlides = [
    {
      eyebrow: "getownerinfo Rwanda",
      title: "Find the real owner. Skip the brokers.",
      body: "Property, vehicles and assets across Rwanda — unlock direct owner contact in seconds.",
      ctaLabel: "Browse listings",
      href: "/listings",
      image: featured[0]?.images?.[0] || "https://picsum.photos/seed/goi-hero-feature/900/640",
    },
    ...featured.slice(0, 3).map((l) => ({
      eyebrow: l.categoryName,
      title: l.title,
      body: `From a verified owner${l.location?.area ? ` in ${l.location.area}` : ""}.`,
      price: l.price,
      ctaLabel: "View listing",
      href: `/listings/${l.id}`,
      image: l.images?.[0],
    })),
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <HeroCarousel slides={heroSlides} />

        {/* Shop by category */}
        <section className="mx-auto max-w-6xl px-4 py-10" data-reveal>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Shop by category</h2>
            <Link href="/listings" className="text-sm font-bold text-brand hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const img = categoryImages[c.slug];
              return (
                <Link
                  key={c.slug}
                  href={`/listings?category=${c.slug}`}
                  className="group relative flex min-h-[140px] flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-br from-[#1576c9] to-[#0c4f9c] text-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  {img && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1f44]/92 via-[#0a1f44]/45 to-transparent" />
                  <div className="relative flex items-center gap-2 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-display text-sm font-bold leading-tight">{c.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Live trust stats */}
        <section className="mx-auto max-w-6xl px-4 py-6" data-reveal>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-4 sm:p-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-brand sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="locations" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10" data-reveal>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Popular locations</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Explore by Kigali area</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">
                Inspired by the local browsing flow: start with a neighborhood, then unlock exact address only when ready.
              </p>
            </div>
            <Link href="/listings" className="btn-outline">View all areas</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_LOCATIONS.map((location) => (
              <Link
                key={location.name}
                href={location.href}
                aria-label={`Browse verified listings in ${location.name}, ${location.district}`}
                className="group block overflow-hidden rounded-xl border border-line bg-ink shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <img
                  src={location.image}
                  alt=""
                  className="aspect-[16/9] h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                />
                <span className="sr-only">{location.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-8" data-reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-bold text-ink">{usingSamples ? "Reference listings" : "Featured listings"}</h2>
                <p className="mt-1 text-ink-soft">
                  {usingSamples ? "Property and vehicle references from the local listing folders you provided." : "Your reference properties first, followed by fresh verified listings."}
                </p>
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

        {/* Safety / verification */}
        <section className="mx-auto max-w-6xl px-4 py-16" data-reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Trust &amp; safety</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">How we keep every deal safe</h2>
            <p className="mt-2 text-ink-soft">
              The token fee protects everyone — it keeps inquiries serious, owner details
              private, and every interaction on the record.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="card premium-hover">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-base font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20" data-reveal>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand to-brand-dark p-8 text-center shadow-lift sm:p-12">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to find the real owner?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              List your property for free, or browse verified listings and unlock direct
              owner contact in seconds.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn bg-white px-6 py-3 text-base text-brand hover:bg-white/90">Get started free</Link>
              <Link href="/listings" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">Browse listings</Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
