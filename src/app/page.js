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
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  Car,
  Clock3,
  FileCheck2,
  Fingerprint,
  Handshake,
  Headphones,
  Home,
  KeyRound,
  Lock,
  PackageCheck,
  Refrigerator,
  ScrollText,
  SearchCheck,
  ShieldCheck,
  Sofa,
  Store,
  Truck,
} from "lucide-react";
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

const CATEGORY_IMAGES = {
  "real-estate": "/sample-properties/kagarama-balcony.jfif",
  vehicles: "/sample-properties/changan-pickup.jfif",
  "home-office-furniture": "/category-images/furniture.png",
  "home-appliances": "/category-images/appliances.png",
  "made-in-rwanda": "/category-images/made-in-rwanda.png",
  "business-industry": "/category-images/business-industry.png",
};

const SHOP_RAIL = [
  ...CATEGORIES,
  { label: "Top Locations", slug: "locations", icon: Home, href: "#locations", image: "/sample-locations/nyarutarama.jfif" },
  { label: "Hot Deals", slug: "hot-deals", icon: BadgeDollarSign, href: "/listings", image: "/hero-banners/generated-assets-vehicles.png" },
];

const PROMO_BANNERS = [
  {
    title: "Owner Studio Upgrade",
    body: "Publish richer photos, clear asset details, and verified owner proof before buyers unlock.",
    href: "/register?role=owner",
    image: "/hero-banners/generated-kagarama-property.png",
    cta: "Submit your listing",
    tone: "yellow",
  },
  {
    title: "Direct Contact Event",
    body: "Unlock exact owner details for homes, plots, vehicles and business assets in one trusted flow.",
    href: "/listings",
    image: "/hero-banners/generated-assets-vehicles.png",
    cta: "Get a token",
    tone: "white",
  },
];

const FEATURE_BANDS = [
  {
    title: "Verified owner homes",
    body: "Browse serious property listings with real photos and protected owner contact.",
    href: "/listings?category=real-estate",
    image: "/sample-properties/kagarama-house.jfif",
    cta: "Shop property",
  },
  {
    title: "Vehicle deals",
    body: "Cars and pickups with direct-owner unlock flow and clear public details.",
    href: "/listings?category=vehicles",
    image: "/sample-properties/changan-pickup.jfif",
    cta: "See vehicles",
  },
  {
    title: "Land opportunities",
    body: "Development plots and high-value assets across Rwanda.",
    href: "/listings?category=real-estate&location=Kinigi",
    image: "/sample-properties/kinigi-plot.jfif",
    cta: "Explore land",
  },
];

const SERVICE_STRIP = [
  { icon: Truck, title: "Verified listings", body: "Owner and asset checks before publishing." },
  { icon: BadgeDollarSign, title: "Token unlock", body: "Pay only when ready for exact contact." },
  { icon: PackageCheck, title: "Protected details", body: "Watermarked access logs reduce sharing." },
  { icon: Headphones, title: "Local support", body: "+250 788 385 831 for help." },
];

const MARKET_TILES = [
  { title: "Upgrade to Business", body: "For agencies, institutions, and serious owners managing many listings.", image: "/sample-properties/kagarama-balcony.jfif", href: "/contact" },
  { title: "Buyer Connect", body: "Compare public details first, then unlock only when a listing is worth it.", image: "/sample-properties/kagarama-room.jfif", href: "/listings" },
  { title: "VIP Owner Support", body: "Priority help for high-value property, plots, vehicles, and business assets.", image: "/sample-locations/kacyiru.jfif", href: "/support" },
  { title: "Protected Token Access", body: "Exact contacts stay private until a serious buyer pays the token fee.", image: "/sample-properties/kia-niro-interior.jfif", href: "/pricing" },
  { title: "Sell or Trade Your Asset", body: "Publish property, cars, furniture, appliances and local business assets.", image: "/hero-banners/generated-assets-vehicles.png", href: "/register?role=owner" },
  { title: "Explore Top Areas", body: "Start with a neighborhood, then unlock the exact address only when ready.", image: "/sample-locations/rebero.jfif", href: "#locations" },
];

const NETWORK_TILES = [
  { title: "Property", body: "Verified homes, rooms, apartments, and plots.", image: "/sample-properties/kagarama-house.jfif" },
  { title: "Vehicles", body: "Cars and pickups from direct owners.", image: "/sample-properties/kia-niro-exterior.jfif" },
  { title: "Locations", body: "Kigali neighborhoods with real local imagery.", image: "/sample-locations/kimihurura.jfif" },
  { title: "Business", body: "Useful assets for work, trade, and growth.", image: "/category-images/business-industry.png" },
  { title: "Home Goods", body: "Furniture and appliances in one trusted place.", image: "/category-images/furniture.png" },
  { title: "Made in Rwanda", body: "Local products and useful everyday items.", image: "/category-images/made-in-rwanda.png" },
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

function money(n) {
  return n == null ? "" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
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
  const featured = [...SAMPLE_LISTINGS, ...liveListings].slice(0, 6);
  const stats = [
    { label: "Active listings", value: compact(activeCount) },
    { label: "Verified owners", value: compact(ownerCount) },
    { label: "Contacts unlocked", value: compact(unlockCount) },
    { label: "Categories", value: String(catCount) },
  ];
  return { featured, stats, usingSamples: liveListings.length === 0 };
}

export default async function HomePage() {
  const { featured, stats, usingSamples } = await getHomeData();

  const heroSlides = [
    {
      eyebrow: "getownerinfo Rwanda",
      title: "Find the real owner. Skip the brokers.",
      body: "Property, vehicles and assets across Rwanda. Unlock direct owner contact in seconds.",
      ctaLabel: "Browse listings",
      href: "/listings",
      image: "/hero-banners/generated-kagarama-property.png",
    },
    ...featured.slice(0, 3).map((l) => ({
      eyebrow: l.categoryName,
      title: l.title,
      body: `From a verified owner${l.location?.area ? ` in ${l.location.area}` : ""}.`,
      price: l.price,
      ctaLabel: "View listing",
      href: l.href || `/listings/${l.id}`,
      image: l.images?.[0],
    })),
  ];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <HeroCarousel slides={heroSlides} />

        <section className="bg-[#003b79] text-white" aria-label="Shop by category" data-reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
            {SHOP_RAIL.map((category) => {
              const Icon = category.icon;
              const image = category.image || CATEGORY_IMAGES[category.slug];
              return (
                <Link
                  key={category.slug}
                  href={category.href || `/listings?category=${category.slug}`}
                  className="group relative min-h-[118px] overflow-hidden border-r border-white/10 bg-[#06284e] last:border-r-0"
                >
                  {image && (
                    <img src={image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-78 transition duration-500 group-hover:scale-105 group-hover:opacity-95" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#001b35] via-[#001b35]/42 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-white/12 text-white backdrop-blur">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black leading-tight text-white">{category.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-b border-[#003b79] bg-[#003b79]" data-reveal>
          <div className="mx-auto grid max-w-6xl gap-px bg-[#003b79] px-4 py-4 md:grid-cols-2">
            {PROMO_BANNERS.map((promo) => (
              <Link
                key={promo.title}
                href={promo.href}
                className={`group grid min-h-[220px] overflow-hidden rounded-sm md:grid-cols-[0.82fr_1fr] ${
                  promo.tone === "yellow" ? "bg-[#ffc400] text-[#071c1f]" : "bg-white text-[#071c1f]"
                }`}
              >
                <div className="flex flex-col justify-center p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0b5f86]">Featured event</p>
                  <h2 className="mt-1 font-display text-3xl font-black leading-none">{promo.title}</h2>
                  <p className="mt-2 max-w-sm text-sm font-bold leading-5 text-[#071c1f]/72">{promo.body}</p>
                  <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm bg-[#d71920] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                    {promo.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="relative min-h-[180px] overflow-hidden">
                  <img src={promo.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-brand/12 mix-blend-screen" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white" data-reveal>
          <Link href="/listings?location=Kinigi" className="group mx-auto grid max-w-6xl overflow-hidden border-x border-[#003b79] md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[190px] flex-col justify-center bg-[#f6fbff] px-6 py-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0b5f86]">Direct owner spotlight</p>
              <h2 className="mt-2 font-display text-4xl font-black leading-none text-[#071c1f] sm:text-5xl">Kinigi plot near hotel activity</h2>
              <p className="mt-3 text-base font-bold text-[#0b5f86]">1,800 sqm - Musanze district - tourism corridor</p>
              <span className="mt-5 inline-flex w-fit items-center rounded-sm bg-[#d71920] px-6 py-2.5 text-sm font-black uppercase text-white">Shop now</span>
            </div>
            <div className="relative min-h-[220px] overflow-hidden bg-[#003b79]">
              <img src="/hero-banners/generated-kinigi-plot.png" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#003b79]/18" />
            </div>
          </Link>
        </section>

        <section className="bg-[#003b79] py-4" data-reveal>
          <div className="mx-auto grid max-w-6xl gap-3 px-4 md:grid-cols-3">
            {FEATURE_BANDS.map((promo) => (
              <Link
                key={promo.title}
                href={promo.href}
                className="group relative min-h-[214px] overflow-hidden rounded-sm bg-[#071c1f] shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <img src={promo.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001b35]/95 via-[#001b35]/35 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-5 text-white">
                  <h2 className="font-display text-2xl font-black leading-tight">{promo.title}</h2>
                  <p className="mt-1 max-w-sm text-sm font-semibold leading-5 text-white/82">{promo.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-brand-light">
                    {promo.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-b border-line bg-[#f4f6f8] py-10" data-reveal>
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-[#071c1f]" />
                <h2 className="font-display text-2xl font-black text-[#071c1f]">Today's Top Deals</h2>
              </div>
              <Link href="/listings" className="text-xs font-black uppercase tracking-wide text-[#0b5f86] hover:underline">Browse all deals & specials</Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line md:grid-cols-3 lg:grid-cols-6">
              {featured.slice(0, 6).map((item, i) => (
                <Link
                  key={`deal-${item.id}`}
                  href={item.href || `/listings/${item.id}`}
                  className="group min-h-[278px] bg-white p-3 transition duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-panel">
                    {item.images?.[0] && (
                      <img src={item.images[0]} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    )}
                    <span className="absolute left-0 top-0 bg-[#28a745] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">
                      Save {String(i + 10)}%
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 min-h-[3.75rem] text-xs font-bold leading-5 text-ink">{item.title}</p>
                  <p className="mt-2 font-display text-lg font-black text-[#d71920]">{money(item.price)}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#28a745]">
                    <Clock3 className="h-3.5 w-3.5" /> Verified owner contact
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-10" data-reveal>
          <div className="mx-auto grid max-w-6xl gap-px bg-[#003b79] px-4 md:grid-cols-2">
            {MARKET_TILES.map((tile) => (
              <Link key={tile.title} href={tile.href} className="group relative min-h-[245px] overflow-hidden bg-[#001b35] text-white">
                <img src={tile.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-82 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#001b35]/92 via-[#001b35]/35 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-5">
                  <h3 className="font-display text-3xl font-black leading-none">{tile.title}</h3>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-5 text-white/82">{tile.body}</p>
                  <span className="mt-3 text-xs font-black uppercase tracking-wide text-white">Learn more</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-[#003b79] py-16 text-white" data-reveal>
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="font-display text-4xl font-black">Welcome to GetOwnerInfo</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/82">
              A trusted Rwandan marketplace for finding verified property, vehicles, plots, furniture, appliances, and business assets without broker noise.
            </p>
            <Link href="/about" className="mt-4 inline-flex text-xs font-black uppercase tracking-wide text-brand-light hover:underline">Learn more about us</Link>
            <div className="relative mt-8 aspect-[16/7] overflow-hidden rounded-sm bg-[#001b35] shadow-lift">
              <img src="/hero-banners/generated-kagarama-property.png" alt="" loading="lazy" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001b35]/45 to-transparent" />
            </div>
          </div>
        </section>

        <section className="bg-[#0074c8] py-12 text-white" data-reveal>
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="font-display text-3xl font-black">More Than Just Property</h2>
              <p className="mt-2 text-sm font-semibold text-white/82">A broader marketplace for serious local deals, powered by verified owner access.</p>
            </div>
            <div className="mt-7 grid gap-px bg-white/25 sm:grid-cols-2 lg:grid-cols-6">
              {NETWORK_TILES.map((tile) => (
                <div key={tile.title} className="bg-[#003b79]">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img src={tile.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-h-[116px] p-3">
                    <h3 className="font-display text-xl font-black">{tile.title}</h3>
                    <p className="mt-1 text-xs font-semibold leading-5 text-white/78">{tile.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-[#f6f8fa]" data-reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-line border-x border-line bg-white md:grid-cols-4 md:divide-y-0">
            {SERVICE_STRIP.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex min-h-[86px] items-center gap-3 px-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <p className="text-sm font-black text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-4 text-ink-soft">{item.body}</p>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

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
                Start with a neighborhood, then unlock exact address only when ready.
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
                className="group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-xl bg-ink shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <img
                  src={location.photo}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03121e] via-[#03121e]/72 to-[#03121e]/15" />

                <div className="absolute left-3 top-3 flex w-[calc(100%-1.5rem)] items-start justify-between">
                  <span className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
                    Top {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand">
                    getownerinfo
                  </span>
                </div>

                <div className="relative p-4 sm:p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-light">{location.eyebrow}</p>
                  <h3 className="mt-0.5 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">{location.name}</h3>
                  <span className="mt-2 block h-1 w-12 rounded-full bg-brand" />
                  <p className="mt-2.5 max-w-xs text-sm font-medium text-white/90">{location.tagline}</p>
                  <p className="mt-2 border-t border-white/20 pt-2 text-[11px] font-bold uppercase tracking-wide text-white/85">
                    {location.district}, Rwanda - Verified listings - Rent &amp; sale
                  </p>
                </div>
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

        <section className="mx-auto max-w-6xl px-4 py-16" data-reveal>
          <div className="max-w-2xl">
            <p className="eyebrow">Trust &amp; safety</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">How we keep every deal safe</h2>
            <p className="mt-2 text-ink-soft">
              The token fee protects everyone. It keeps inquiries serious, owner details
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
