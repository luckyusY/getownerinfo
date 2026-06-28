"use client";

import { useState } from "react";
import { heroImage, thumbImage } from "@/lib/imageUrl";

export default function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return <div className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-panel text-ink-faint">No image</div>;
  }
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-panel shadow-soft">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImage(images[active])} alt={title} decoding="async" className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {images.slice(0, 5).map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative h-16 w-20 overflow-hidden rounded-lg ring-2 transition ${
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
