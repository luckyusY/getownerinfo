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
import {
  BadgeDollarSign, BriefcaseBusiness, Car, FileCheck2, Fingerprint, Handshake,
  Headphones, Home, KeyRound, Lock, PackageCheck, Refrigerator, ScrollText,
  SearchCheck, ShieldCheck, Sofa, Store, Truck,
} from "lucide-react";
import { POPULAR_LOCATIONS } from "@/data/locations";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "Real Estate", slug: "real-estate", icon: Home },
  { label: "Vehicles", slug: "vehicles", icon: Car },
  { label: "Furniture", slug: "home-office-furniture", icon: Sofa },
  { label: "Appliances", slug: "home-appliances", icon: Refrigerator },
  { label: "Made in Rwanda", slug: "made-in-rwanda", icon: Store },
  { label: "Business", slug: "business-industry", icon: BriefcaseBusiness },
];

const SERVICE_STRIP = [
  { icon: Truck, title: "Verified listings", body: "Owner and asset checks before publishing." },
  { icon: BadgeDollarSign, title: "Token unlock", body: "Pay only when ready for exact contact." },
  { icon: PackageCheck, title: "Protected details", body: "Watermarked logs reduce sharing." },
  { icon: Headphones, title: "Local support", body: "+250 788 385 831 for help." },
];

const STEPS = [
  { icon: SearchCheck, title: "Browse verified listings", body: "Property, vehicles and assets across Rwanda, with every owner verified by our team." },
  { icon: KeyRound, title: "Unlock with a token", body: "Pay a small, non-refundable fee to reveal the owner's contact and exact location." },
  { icon: Handshake, title: "Deal directly", body: "Call the owner, view, and negotiate. No brokers, no inflated middle-man fees." },
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
  const featured = liveListings.slice(0, 6);
  const stats = [
    { label: "Active listings", value: compact(activeCount) },
    { label: "Verified owners", value: compact(ownerCount) },
    { label: "Contacts unlocked", value: compact(unlockCount) },
    { label: "Categories", value: String(catCount) },
  ];
  return { featured, stats };
}

export default async function HomePage() {
  const { featured, stats } = await getHomeData();

  const heroSlides = [
    {
      eyebrow: "Kigali verified marketplace",
      title: "Browse real listings across Kigali.",
      body: "Start from trusted public details, known locations, and verified listing photos before you unlock direct owner contact.",
      ctaLabel: "Browse listings",
      href: "/listings",
      image: "/hero-slides/kigali-convention-marketplace.webp",
      layout: "banner",
      metaLabel: "Kigali",
      metaValue: "Verified",
    },
    {
      eyebrow: "Popular locations",
      title: "Search by area before exact address.",
      body: "Explore neighborhoods first, compare public details, then reveal the precise owner contact only when the opportunity is serious.",
      ctaLabel: "Explore locations",
      href: "#locations",
      image: "/hero-slides/kigali-locations-aerial.webp",
      layout: "banner",
      metaLabel: "Area",
      metaValue: "First",
    },
    {
      eyebrow: "Secure owner access",
      title: "Unlock contact and deal directly.",
      body: "Use a protected token flow to reveal owner details, inspect the asset, and negotiate without broker noise.",
      ctaLabel: "List your property",
      href: "/register?role=owner",
      image: "/hero-slides/kigali-owner-secure.webp",
      layout: "banner",
      metaLabel: "Direct",
      metaValue: "Owner",
    },
    ...featured.slice(0, 2).map((l) => ({
      eyebrow: l.categoryName,
      title: l.title,
      body: `From a verified owner${l.location?.area ? ` in ${l.location.area}` : ""}.`,
      price: l.price,
      ctaLabel: "View listing",
      href: l.href || `/listings/${l.id}`,
      image: l.images?.[0],
      images: l.images || [],
      caption: `${l.images?.length || 1} real listing photo${(l.images?.length || 1) === 1 ? "" : "s"}${l.location?.area ? ` from ${l.location.area}` : ""}`,
    })),
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <HeroCarousel slides={heroSlides} />

        {/* Shop by category */}
        <section className="relative z-20 -mt-12 bg-[#003b79] px-4 pb-4 pt-3 shadow-[0_-18px_44px_rgba(0,59,121,0.22)] sm:-mt-16 sm:pb-5" data-reveal>
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between gap-3 text-white">
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-white">Shop by category</h2>
              <Link href="/listings" className="text-xs font-black uppercase tracking-wide text-cyan-100 hover:text-white">View all</Link>
            </div>
            <div className="grid auto-cols-[152px] grid-flow-col gap-2 overflow-x-auto pb-1 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <Link
                    key={c.slug}
                    href={`/listings?category=${c.slug}`}
                    className="group relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-md bg-gradient-to-br from-[#16a3cc] via-[#0b7fa8] to-[#0b5f86] p-3 text-white shadow-soft ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:min-h-[118px]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.22),transparent_28%)] opacity-80" />
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/16 text-white ring-1 ring-white/15 backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="relative">
                      <span className="font-display text-sm font-black leading-tight text-white drop-shadow">{c.label}</span>
                      <span className="mt-2 block h-0.5 w-8 rounded-full bg-cyan-100/80 transition-all duration-300 group-hover:w-12" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust stats */}
        <section className="mx-auto max-w-6xl px-4" data-reveal>
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-5 shadow-soft sm:grid-cols-4 sm:p-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-brand sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service strip */}
        <section className="mx-auto max-w-6xl px-4 py-8" data-reveal>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {SERVICE_STRIP.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-soft">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-4 text-ink-soft">{item.body}</p>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Featured listings */}
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

        {/* Popular locations */}
        <section id="locations" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-10" data-reveal>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Popular locations</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Explore by Kigali area</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">Start with a neighborhood, then unlock the exact address only when ready.</p>
            </div>
            <Link href="/listings" className="btn-outline">View all areas</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_LOCATIONS.map((location, i) => (
              <Link
                key={location.name}
                href={location.href}
                aria-label={`Browse verified listings in ${location.name}, ${location.district}`}
                className="group relative flex min-h-[214px] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-[#062f46] via-[#0b6f91] to-[#16a3cc] p-5 text-white shadow-soft ring-1 ring-cyan-100/20 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(255,255,255,0.24),transparent_26%),radial-gradient(circle_at_18%_90%,rgba(6,24,31,0.55),transparent_38%)]" />
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-cyan-100/20" />
                <div className="pointer-events-none absolute -bottom-14 left-8 h-40 w-40 rounded-full border border-white/10" />

                <div className="relative flex items-start justify-between gap-3">
                  <span className="rounded-md bg-white/16 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm ring-1 ring-white/15 backdrop-blur">Top {String(i + 1).padStart(2, "0")}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#0b6f91] shadow-sm">getownerinfo</span>
                </div>

                <div className="relative">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100">{location.eyebrow}</p>
                  <h3 className="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">{location.name}</h3>
                  <span className="mt-3 block h-1 w-14 rounded-full bg-cyan-100 shadow-[0_0_22px_rgba(207,250,254,0.55)]" />
                  <p className="mt-3 max-w-sm text-sm font-semibold leading-6 text-white/88">{location.tagline}</p>
                  <p className="mt-4 border-t border-white/18 pt-3 text-[11px] font-black uppercase tracking-wide text-white/82">{location.district}, Rwanda - Verified listings - Rent &amp; sale</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16" data-reveal>
          <h2 className="font-display text-3xl font-bold text-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="card premium-hover">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust strip */}
        <section className="mx-auto max-w-6xl px-4 pb-4" data-reveal>
          <div className="grid gap-6 rounded-xl bg-ink p-6 text-white shadow-lift sm:grid-cols-3">
            {[
              [ShieldCheck, "Verified owners", "Every listing is checked by our team before it goes live."],
              [KeyRound, "Private by design", "Contact details stay hidden until a buyer pays the token fee."],
              [Handshake, "Accountable deals", "Immutable access logs and automatic commission enforcement."],
            ].map(([Icon, t, b]) => (
              <div key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"><Icon className="h-4 w-4" /></span>
                <span>
                  <p className="font-display text-lg font-semibold text-white">{t}</p>
                  <p className="mt-1 text-sm text-white/75">{b}</p>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & safety */}
        <section className="mx-auto max-w-6xl px-4 py-16" data-reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Trust &amp; safety</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">How we keep every deal safe</h2>
            <p className="mt-2 text-ink-soft">The token fee protects everyone — it keeps inquiries serious, owner details private, and every interaction on the record.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="card premium-hover">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>
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
            <p className="mx-auto mt-3 max-w-xl text-white/85">List your property for free, or browse verified listings and unlock direct owner contact in seconds.</p>
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
