"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Diamond, FilePlus2, Home, KeyRound, Lock, MapPin, MessageSquare,
  Search, ShieldCheck, Tag, UserCheck,
} from "lucide-react";

const HERO_TABPANEL_ID = "hero-tabpanel";

const TABS = [
  { key: "sale", label: "Buy", icon: Home },
  { key: "rent", label: "Rent", icon: KeyRound },
  { key: "sell", label: "Sell", icon: Diamond },
  { key: "request", label: "Post a Request", icon: FilePlus2 },
];

const PRICE_RANGES = [
  { label: "Any price", min: "", max: "" },
  { label: "Under 500,000 Rwf", min: "", max: "500000" },
  { label: "500,000 – 2M Rwf", min: "500000", max: "2000000" },
  { label: "2M – 10M Rwf", min: "2000000", max: "10000000" },
  { label: "10M – 50M Rwf", min: "10000000", max: "50000000" },
  { label: "Over 50M Rwf", min: "50000000", max: "" },
];

const PROMISES = [
  { icon: UserCheck, title: "Contact Real Owners", body: "Get verified contact information after a small token payment.", tone: "bg-brand-50 text-brand" },
  { icon: ShieldCheck, title: "Verified Listings", body: "Secure and transparent platform.", tone: "bg-emerald-50 text-emerald-600" },
  { icon: MessageSquare, title: "Chat Before You Pay", body: "Ask questions and get more details before unlocking contact info.", tone: "bg-sky-50 text-sky-dark" },
  { icon: Lock, title: "Safe & Private", body: "Your privacy and security come first.", tone: "bg-violet-50 text-violet-600" },
];

export default function HomeHero({ categories = [], locations = [] }) {
  const router = useRouter();
  const [tab, setTab] = useState("sale");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [priceIndex, setPriceIndex] = useState(0);
  const [keyword, setKeyword] = useState("");

  function onSubmit(e) {
    e.preventDefault();

    // The two non-search tabs are destinations, not filters.
    if (tab === "sell") {
      router.push("/dashboard/owner/listings/new");
      return;
    }
    if (tab === "request") {
      router.push("/seekers/new");
      return;
    }

    const params = new URLSearchParams();
    params.set("type", tab);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (keyword.trim()) params.set("q", keyword.trim());
    const range = PRICE_RANGES[priceIndex];
    if (range.min) params.set("minPrice", range.min);
    if (range.max) params.set("maxPrice", range.max);
    router.push(`/listings?${params.toString()}`);
  }

  const isSearchTab = tab === "sale" || tab === "rent";

  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* This is the page's LCP element. As a plain <img> the browser finds
          it at normal priority partway through parsing the document, so it
          asks for it high instead. */}
      <img
        src="/hero-slides/kigali-owner-secure.webp"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-10 lg:grid-cols-[1.35fr_0.65fr] lg:pb-12 lg:pt-16">
        {/* min-w-0: without it the scrollable tab row below widens this grid
            track past the viewport, and the section clips the overflow. */}
        <div className="min-w-0 max-w-2xl">
          <h1 className="font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
            Find. Connect. Deal
            <br className="hidden sm:block" /> with{" "}
            <span className="relative text-brand">
              Confidence.
              <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-sky/60" />
            </span>
          </h1>
          <p className="mt-5 text-base font-semibold text-ink-soft sm:text-lg">
            Verified owners. Real listings. Secure and transparent.
          </p>

          <form onSubmit={onSubmit} className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
            {/*
              Two columns on a phone, the original single row from sm up. The
              four tabs need about 460px and a 375px screen leaves 341, so as a
              scrolling row "Post a Request" started ~119px off screen with
              nothing to say it was there -- and that tab is the entry point for
              the whole seeker side of the marketplace.

              gap-px over a bg-line container draws the dividers between cells,
              so the buttons need no borders of their own; both are switched off
              at sm, where the row is exactly what it was before.
            */}
            <div
              role="tablist"
              aria-label="What do you want to do"
              className="grid grid-cols-2 gap-px border-b border-line bg-line sm:flex sm:gap-0 sm:overflow-x-auto sm:bg-transparent"
            >
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  id={`hero-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  aria-controls={HERO_TABPANEL_ID}
                  onClick={() => setTab(key)}
                  /* The background sits in the conditional rather than the base
                     string: bg-surface and bg-brand are both background-color
                     utilities, so which one won would come down to their order
                     in the stylesheet, not their order here. */
                  className={`inline-flex shrink-0 items-center justify-center gap-2 px-3 py-3.5 text-sm font-bold transition sm:justify-start sm:px-5 ${
                    tab === key
                      ? "bg-brand text-white"
                      : "bg-surface text-ink-soft hover:bg-panel hover:text-ink sm:bg-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {isSearchTab ? (
              <div
                role="tabpanel"
                id={HERO_TABPANEL_ID}
                aria-labelledby={`hero-tab-${tab}`}
                className="grid gap-2 p-3 lg:grid-cols-[1fr_1fr_1fr_1.3fr_auto]"
              >
                <Field icon={Home} label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="hero-field-input" aria-label="Category">
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </Field>

                <Field icon={MapPin} label="Location">
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="hero-field-input" aria-label="Location">
                    <option value="">Kigali, Rwanda</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </Field>

                <Field icon={Tag} label="Price range">
                  <select
                    value={priceIndex}
                    onChange={(e) => setPriceIndex(Number(e.target.value))}
                    className="hero-field-input"
                    aria-label="Price range"
                  >
                    {PRICE_RANGES.map((r, i) => (
                      <option key={r.label} value={i}>{r.label}</option>
                    ))}
                  </select>
                </Field>

                <label className="input-wrap !min-h-[58px] !rounded-xl">
                  <Search className="h-[18px] w-[18px] shrink-0 text-ink-faint" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Search by keyword (e.g. house, car, laptop...)"
                    aria-label="Search by keyword"
                    className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-faint"
                  />
                </label>

                <button type="submit" className="btn-primary !min-h-[58px] !rounded-xl !px-7 !text-base">
                  Search
                </button>
              </div>
            ) : (
              <div
                role="tabpanel"
                id={HERO_TABPANEL_ID}
                aria-labelledby={`hero-tab-${tab}`}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <p className="text-sm font-semibold text-ink-soft">
                  {tab === "sell"
                    ? "Create one listing with proof of ownership. We verify it before buyers can unlock your contact."
                    : "Tell owners exactly what you need. Your contact stays hidden until someone pays the view token."}
                </p>
                <button type="submit" className="btn-primary !min-h-12 !rounded-xl !px-6">
                  {tab === "sell" ? "Start a listing" : "Post a request"}
                </button>
              </div>
            )}
          </form>
        </div>

        <aside className="min-w-0 self-center rounded-2xl border border-line bg-surface/95 p-5 shadow-lift backdrop-blur">
          <ul className="grid gap-5">
            {PROMISES.map(({ icon: Icon, title, body, tone }) => (
              <li key={title} className="flex gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <p className="text-sm font-bold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-ink-soft">{body}</p>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="flex min-h-[58px] items-center gap-2 rounded-xl border border-line bg-surface px-3.5 transition focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(22,104,227,0.15)]">
      <Icon className="h-[18px] w-[18px] shrink-0 text-brand" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold text-ink-faint">{label}</span>
        {children}
      </span>
    </label>
  );
}
