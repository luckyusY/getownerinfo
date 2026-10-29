import Link from "next/link";
import {
  Fingerprint, FileCheck2, Handshake, KeyRound, Lock, ScrollText, SearchCheck, ShieldCheck, Store, Headphones,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HomeHero from "@/components/public/HomeHero";
import CategoryIconRow from "@/components/public/CategoryIconRow";
import FeaturedListings from "@/components/public/FeaturedListings";
import TrustRow from "@/components/public/TrustRow";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import User from "@/models/User";
import TokenUnlock from "@/models/TokenUnlock";
import { ROLES } from "@/lib/constants";
import { publicListingFilter } from "@/lib/listingQuery";
import { RWANDA_LOCATIONS, POPULAR_LOCATIONS } from "@/data/locations";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: SearchCheck, title: "Browse verified listings", body: "Property, vehicles and assets across Rwanda, with every owner verified by our team." },
  { icon: KeyRound, title: "Unlock with a token", body: "Pay a small, non-refundable fee to reveal the owner's contact and exact location." },
  { icon: Handshake, title: "Deal directly", body: "Call the owner, view, and negotiate. No brokers, no inflated middle-man fees." },
];

const JOURNEYS = [
  { icon: SearchCheck, title: "I want to buy or rent", body: "Search verified listings, save options, then unlock owner contact only when you are serious.", href: "/listings", cta: "Browse listings" },
  { icon: Store, title: "I want to sell or rent out", body: "Create one account, submit proof, and publish property or assets after review.", href: "/register?role=owner", cta: "List your property" },
  { icon: Headphones, title: "I cannot find what I need", body: "Post a request so owners and managers can see exactly what you are looking for.", href: "/seekers/new", cta: "Post what you need" },
];

const SAFETY = [
  { icon: Fingerprint, title: "Identity verified", body: "Owners submit ID and ownership proof. Our team verifies before a listing goes live." },
  { icon: Lock, title: "Privacy protected", body: "Contact and exact location stay hidden until a buyer pays the token fee." },
  { icon: ScrollText, title: "Immutable access logs", body: "Every unlock is recorded permanently and used to enforce fair commissions." },
  { icon: FileCheck2, title: "Watermarked contacts", body: "Revealed details are stamped with the viewer's identity to deter sharing." },
];

function compact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

// The homepage is the front door: a database blip should degrade it, not take
// it down. On failure it renders without listings rather than throwing into the
// error boundary.
const EMPTY_HOME = {
  categories: [],
  featured: [],
  stats: [],
  degraded: true,
};

async function getHomeData() {
  try {
    return await loadHomeData();
  } catch (err) {
    console.error("Homepage data unavailable:", err?.message || err);
    return EMPTY_HOME;
  }
}

async function loadHomeData() {
  await connectDB();
  const [listings, categories, activeCount, ownerCount, unlockCount] = await Promise.all([
    Listing.find(publicListingFilter()).sort({ createdAt: -1 }).limit(8).lean(),
    Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    Listing.countDocuments(publicListingFilter()),
    User.countDocuments({ role: ROLES.OWNER }),
    TokenUnlock.countDocuments({}),
  ]);

  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

  return {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    featured: listings.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      images: (l.images || []).map((m) => m.url),
      price: l.price,
      transactionType: l.transactionType,
      model: l.model,
      itemType: l.itemType,
      attributes: l.attributes || {},
      location: { area: l.location?.area || null },
      categoryName: catName[l.category?.toString()] || "Listing",
    })),
    stats: [
      { label: "Active listings", value: compact(activeCount) },
      { label: "Verified owners", value: compact(ownerCount) },
      { label: "Contacts unlocked", value: compact(unlockCount) },
      { label: "Categories", value: String(categories.length) },
    ],
    degraded: false,
  };
}

export default async function HomePage() {
  const { featured, categories, stats, degraded } = await getHomeData();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <HomeHero categories={categories} locations={RWANDA_LOCATIONS} />

        <CategoryIconRow categories={categories} />

        {/* No data-reveal here: AppMotion hides reveal targets until scroll,
            and this row can sit above the fold on a phone. */}
        <section className="mx-auto max-w-7xl px-4 py-6">
          <FeaturedListings listings={featured.slice(0, 4)} />
        </section>

        <TrustRow />

        {/* Trust stats */}
        {stats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4" data-reveal>
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-4 sm:p-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold text-brand sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-faint sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {degraded && (
          <section className="mx-auto max-w-7xl px-4 py-4">
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Listings are temporarily unavailable. Everything else still works — please try again shortly.
            </p>
          </section>
        )}

        {/* Choose your path */}
        <section className="mx-auto max-w-7xl px-4 py-10" data-reveal>
          <div className="mb-5">
            <p className="eyebrow">Choose your path</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">What are you here to do?</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Buy, sell, rent, or request. One account covers all of it.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {JOURNEYS.map(({ icon: Icon, title, body, href, cta }) => (
              <Link key={title} href={href} className="card premium-hover group !p-5">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
                <span className="mt-4 inline-flex text-sm font-black text-brand group-hover:text-brand-dark">{cta}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* More listings */}
        {featured.length > 4 && (
          <section className="mx-auto max-w-7xl px-4 py-6" data-reveal>
            <FeaturedListings listings={featured.slice(4, 8)} />
          </section>
        )}

        {/* Popular locations */}
        <section id="locations" className="mx-auto max-w-7xl scroll-mt-[calc(var(--header-h)+1rem)] px-4 py-10" data-reveal>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Popular locations</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Explore by Kigali area</h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-soft">
                Start with a neighborhood, then unlock the exact address only when ready.
              </p>
            </div>
            <Link href="/listings" className="btn-outline">View all areas</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_LOCATIONS.map((location, i) => (
              <Link
                key={location.name}
                href={location.href}
                aria-label={`Browse verified listings in ${location.name}, ${location.district}`}
                className="group relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={location.photo} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                <div className="relative">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-sky-light">{location.eyebrow}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">{location.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/85">{location.tagline}</p>
                  <p className="mt-3 border-t border-white/20 pt-2 text-[11px] font-bold uppercase tracking-wide text-white/70">
                    {location.district}, Rwanda · Rent &amp; sale
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-7xl scroll-mt-[calc(var(--header-h)+1rem)] px-4 py-12" data-reveal>
          <h2 className="font-display text-3xl font-bold text-ink">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card premium-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & safety */}
        <section className="mx-auto max-w-7xl px-4 py-12" data-reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Trust &amp; safety</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">How we keep every deal safe</h2>
            <p className="mt-2 text-ink-soft">
              The token fee protects everyone — it keeps inquiries serious, owner details private, and every
              interaction on the record.
            </p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY.map(({ icon: Icon, title, body }) => (
              <div key={title} className="card premium-hover">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16" data-reveal>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-center shadow-lift sm:p-12">
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready to find the real owner?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              List your property, or browse verified listings and unlock direct owner contact in seconds.
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
