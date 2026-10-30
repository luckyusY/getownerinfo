"use client";

import { useCallback, useRef, useState } from "react";
import { cardImage } from "@/lib/imageUrl";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The photo strip on a listing card, for listings that have more than one.
 *
 * The whole card is a link, which rules out a drag-based carousel: a drag that
 * starts on an anchor fights the browser's own gesture handling and ends in a
 * navigation as often as not. This is a scroll-snap strip instead, so a swipe
 * is an ordinary scroll — the browser never reads it as a tap — and a tap still
 * opens the listing, which is what someone swiping photos expects next.
 *
 * The arrows are pointer-only affordances; they call preventDefault because
 * they sit inside that link and would otherwise navigate instead of advancing.
 */
export default function CardGallery({ images, alt }) {
  const stripRef = useRef(null);
  const [index, setIndex] = useState(0);

  // Derived from the scroll position rather than tracked separately, so a
  // swipe, an arrow and a momentum scroll all agree on where we are.
  const onScroll = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex((prev) => (prev === next ? prev : next));
  }, []);

  const go = useCallback((event, delta) => {
    // Inside the card's <a>: without this, the arrow opens the listing.
    event.preventDefault();
    event.stopPropagation();
    const el = stripRef.current;
    if (!el) return;
    const target = Math.min(
      Math.max(Math.round(el.scrollLeft / el.clientWidth) + delta, 0),
      images.length - 1
    );
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
  }, [images.length]);

  return (
    <>
      <div
        ref={stripRef}
        onScroll={onScroll}
        role="group"
        aria-label={`${images.length} photos of ${alt}`}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={cardImage(src)}
            alt={i === 0 ? alt : `${alt} — photo ${i + 1}`}
            /* The first photo is what the grid is actually showing; the rest
               are one swipe away and not worth the bandwidth up front. */
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {/* Pointer only. On a touch screen the swipe is the control, and these
          would just cover the photo. */}
      <button
        type="button"
        aria-label="Previous photo"
        onClick={(e) => go(e, -1)}
        disabled={index === 0}
        className="absolute left-1.5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-ink/45 text-white backdrop-blur transition hover:bg-ink/70 disabled:pointer-events-none disabled:opacity-0 md:group-hover:grid"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={(e) => go(e, 1)}
        disabled={index === images.length - 1}
        className="absolute right-1.5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-ink/45 text-white backdrop-blur transition hover:bg-ink/70 disabled:pointer-events-none disabled:opacity-0 md:group-hover:grid"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Sits in the slot the photo count used to occupy, so it collides with
          nothing and says more: how many, and which one you are on. Beyond
          five the dots stop being countable, so it reverts to a tally. */}
      <span className="pointer-events-none absolute bottom-2 right-2 z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/16 px-2 py-1 backdrop-blur">
        {images.length <= 5 ? (
          images.map((src, i) => (
            <span
              key={`dot-${src}-${i}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === index ? "w-3 bg-white" : "w-1.5 bg-white/55"
              }`}
            />
          ))
        ) : (
          <span className="text-xs font-bold text-white">
            {index + 1}/{images.length}
          </span>
        )}
      </span>
    </>
  );
}
