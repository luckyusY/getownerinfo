import Link from "next/link";
import { formatRwf } from "@/lib/format";
import Badge from "@/components/ui/Badge";

/**
 * Presentational listing card, shared by the homepage and the browse grid.
 * @param {object} listing - { id, title, images:[url], price, transactionType, model, location:{area}, categoryName }
 */
export default function PropertyCard({ listing, style }) {
  const l = listing;
  return (
    <Link
      href={`/listings/${l.id}`}
      className="card group !p-3 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
      style={style}
    >
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-panel">
        {l.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink-faint">No image</div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge tone={l.transactionType === "rent" ? "info" : "gold"}>
            {l.transactionType === "rent" ? "For rent" : "For sale"}
          </Badge>
          {l.model === "A" && <Badge tone="brand">Exclusive</Badge>}
        </div>
      </div>
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{l.categoryName || "Listing"}</p>
      <h3 className="mt-0.5 px-1 font-display text-lg font-semibold leading-snug text-ink line-clamp-1">{l.title}</h3>
      <p className="px-1 text-sm text-ink-soft">📍 {l.location?.area || "Location on unlock"}</p>
      <p className="mt-1.5 px-1 pb-1 font-display text-xl font-bold text-brand">{formatRwf(l.price)}</p>
    </Link>
  );
}
