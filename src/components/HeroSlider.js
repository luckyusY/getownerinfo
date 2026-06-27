"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";

const SLIDES = [
  {
    eyebrow: "Verified owner access",
    title: "Find the real owner. Skip the brokers.",
    body: "Browse verified property, vehicles, and assets across Rwanda. Unlock trusted owner details only when you are ready to move.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    badge: "Real Estate",
    metric: "Owner verified",
    href: "/listings?category=real-estate",
  },
  {
    eyebrow: "Direct vehicle deals",
    title: "Contact verified sellers without the runaround.",
    body: "Find cars, motorcycles, and business assets with clear listing details and protected owner information.",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=80",
    badge: "Vehicles",
    metric: "Token unlock",
    href: "/listings?category=vehicles",
  },
  {
    eyebrow: "Privacy built in",
    title: "Reveal exact contacts only after a secure unlock.",
    body: "getownerinfo keeps owner details private until a serious buyer pays the token fee and creates an access log.",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    badge: "Protected",
    metric: "Access logged",
    href: "/register",
  },
];

export default function HeroSlider() {
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];
  const next = () => setActive((index) => (index + 1) % SLIDES.length);
  const previous = () => setActive((index) => (index - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const timer = window.setInterval(next, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const progress = useMemo(() => `${((active + 1) / SLIDES.length) * 100}%`, [active]);

  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-0">
        {SLIDES.map((item, index) => (
          <img
            key={item.title}
            src={item.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              index === active ? "opacity-70" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/78 to-ink/28" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-paper to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-[680px] max-w-6xl items-end gap-10 px-4 pb-12 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-16 lg:pt-20">
        <div className="max-w-3xl animate-fade-up">
          <span className="badge bg-white/10 text-white ring-1 ring-white/20">{slide.eyebrow}</span>
          <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] text-white sm:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/82 sm:text-lg">
            {slide.body}
          </p>

          <HeroSearch />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary px-6 py-3 text-base">List your property</Link>
            <Link href="/listings" className="btn-outline border-white/30 bg-white/10 px-6 py-3 text-base text-white hover:border-white hover:text-white">
              Browse listings
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="ml-auto max-w-md rounded-xl border border-white/20 bg-white/10 p-4 shadow-lift backdrop-blur-md">
            <div className="overflow-hidden rounded-lg bg-white">
              <div className="relative aspect-[4/3]">
                <img src={slide.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="badge bg-brand text-white">{slide.badge}</span>
                  <span className="badge bg-gold text-ink">{slide.metric}</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Featured flow</p>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">Unlock direct owner information</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Review the listing, pay the token fee, then use verified contact details to negotiate directly.
                </p>
                <Link href={slide.href} className="mt-4 inline-flex text-sm font-bold text-brand hover:text-brand-dark">
                  Explore this category
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: progress }} />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-label="Previous hero slide" onClick={previous} className="hero-control">{"<"}</button>
            <button type="button" aria-label="Next hero slide" onClick={next} className="hero-control">{">"}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
