"use client";

import { useEffect, useRef, useState } from "react";
import { heroImage, thumbImage } from "@/lib/imageUrl";

export default function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  const thumbsRef = useRef(null);
  const count = images.length;

  // Keep the selected thumbnail in view when the row scrolls sideways.
  useEffect(() => {
    const row = thumbsRef.current;
    const thumb = row?.children[active];
    if (!row || !thumb) return;
    const r = row.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    if (t.left < r.left || t.right > r.right) {
      row.scrollBy({ left: t.left - r.left - (r.width - t.width) / 2, behavior: "smooth" });
    }
  }, [active]);

  if (!count) {
    return <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-panel text-ink-faint">No image</div>;
  }

  const go = (step) => setActive((i) => (i + step + count) % count);
  const arrow =
    "absolute top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-2xl leading-none text-white backdrop-blur-sm transition hover:bg-black/65";

  return (
    <div>
      <div
        className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-panel shadow-soft"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage(images[active])} alt={title} decoding="async" className="h-full w-full object-cover" />
        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3`}>
              ‹
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3`}>
              ›
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>
      {count > 1 && (
        <div ref={thumbsRef} className="mt-3 flex gap-2.5 overflow-x-auto p-0.5 pb-2">
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === active ? "ring-brand" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumbImage(src)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
