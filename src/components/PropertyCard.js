import { formatRwf } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import MotionCard from "@/components/MotionCard";
import { ArrowUpRight, Camera, KeyRound, MapPin, ShieldCheck } from "lucide-react";

/**
 * Presentational listing card, shared by the homepage and browse grid.
 * @param {object} listing - { id, title, images:[url], price, transactionType, model, location:{area}, categoryName }
 */
export default function PropertyCard({ listing, style }) {
  const l = listing;
  const area = l.location?.area || "Location on unlock";
  const transactionLabel = l.transactionType === "rent" ? "For rent" : "For sale";
  const features = Array.isArray(l.features) ? l.features.slice(0, 2) : [];
  const imageCount = l.images?.length || 0;

  return (
    <MotionCard
      href={`/listings/${l.id}`}
      className="property-card card premium-hover group flex h-full flex-col !p-3 transition duration-300 hover:border-brand/30 hover:shadow-lift"
      style={style}
    >
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-panel">
        {l.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-ink-faint">
            <Camera className="h-6 w-6" />
            No image yet
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/70 to-transparent" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <Badge tone={l.transactionType === "rent" ? "info" : "gold"}>{transactionLabel}</Badge>
          {l.model === "A" && <Badge tone="brand">Exclusive owner</Badge>}
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2 text-white">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-white/76">{l.categoryName || "Listing"}</p>
            <p className="font-display text-xl font-bold text-white">{formatRwf(l.price)}</p>
          </div>
          {imageCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/16 px-2 py-1 text-xs font-bold backdrop-blur">
              <Camera className="h-3.5 w-3.5" /> {imageCount}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 min-h-[3.1rem] font-display text-lg font-semibold leading-snug text-ink">{l.title}</h3>
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition group-hover:border-brand/40 group-hover:text-brand">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-soft">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="truncate">{area}</span>
          </span>
          {l.itemType && <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-bold text-ink-soft">{l.itemType}</span>}
        </div>

        {features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <span key={feature} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-faint">
            {l.model === "A" ? <ShieldCheck className="h-4 w-4 text-brand" /> : <KeyRound className="h-4 w-4 text-clay" />}
            {l.model === "A" ? "Verified exclusive" : "Token unlock"}
          </span>
          <span className="text-sm font-bold text-brand">View details</span>
        </div>
      </div>
    </MotionCard>
  );
}
