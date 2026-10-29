"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ListingCard from "./ListingCard";

/**
 * Featured row. On wide screens it is a four-up grid; below that it scrolls
 * horizontally, and the arrows page it one viewport at a time.
 */
export default function FeaturedListings({ listings = [] }) {
  const trackRef = useRef(null);

  function scrollBy(direction) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  if (!listings.length) return null;

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Featured Listings</h2>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Handpicked verified listings from real owners
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
            View All Listings <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous listings"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-brand/40 hover:text-brand active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next listings"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-brand/40 hover:text-brand active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-5 grid auto-cols-[minmax(240px,78vw)] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[minmax(240px,42vw)] lg:auto-cols-fr lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible"
      >
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
