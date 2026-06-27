import { formatRwf } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import MotionCard from "@/components/MotionCard";

/**
 * Presentational listing card, shared by the homepage and browse grid.
 * @param {object} listing - { id, title, images:[url], price, transactionType, model, location:{area}, categoryName }
 */
export default function PropertyCard({ listing, style }) {
  const l = listing;
  const area = l.location?.area || "Location on unlock";
  const transactionLabel = l.transactionType === "rent" ? "For rent" : "For sale";

  return (
    <MotionCard
      href={`/listings/${l.id}`}
      className="card premium-hover group flex h-full flex-col !p-3 transition duration-300 hover:border-brand/30 hover:shadow-lift"
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
          <Badge tone={l.transactionType === "rent" ? "info" : "gold"}>{transactionLabel}</Badge>
          {l.model === "A" && <Badge tone="brand">Exclusive</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{l.categoryName || "Listing"}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[3.1rem] font-display text-lg font-semibold leading-snug text-ink">{l.title}</h3>
        <p className="mt-1 text-sm font-semibold text-ink-soft">{area}</p>
        <div className="mt-auto pt-3">
          <p className="font-display text-xl font-bold text-brand">{formatRwf(l.price)}</p>
        </div>
      </div>
    </MotionCard>
  );
}
