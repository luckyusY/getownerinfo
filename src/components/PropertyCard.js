import { formatRwf } from "@/lib/format";
import MotionCard from "@/components/MotionCard";
import FavoriteButton from "@/components/FavoriteButton";
import CardGallery from "@/components/CardGallery";
import { cardImage } from "@/lib/imageUrl";
import { ArrowUpRight, Camera, KeyRound, MapPin, ShieldCheck } from "lucide-react";

/**
 * Presentational listing card, shared by the homepage and browse grid.
 * @param {object} listing - { id, title, images:[url], price, transactionType, model, location:{area}, categoryName, ownerVerified }
 */
export default function PropertyCard({ listing, style }) {
  const l = listing;
  const area = l.location?.area || "Location on unlock";
  const transactionLabel = l.transactionType === "rent" ? "For rent" : "For sale";
  const features = Array.isArray(l.features) ? l.features.slice(0, 2) : [];
  const imageCount = l.images?.length || 0;

  return (
    <MotionCard
      href={l.href || `/listings/${l.id}`}
      className="property-card listing-card group"
      style={style}
    >
      {/* The photo runs to the card's edges. Inset inside a padded card it
          was a picture in a frame; full-bleed, the card is the picture. */}
      <div className="relative aspect-[4/3] overflow-hidden bg-panel">
        {/* More than one photo turns the still into a strip you can swipe.
            The hover zoom stays off in that case: it scales the scroll
            container and drags the neighbouring photo into frame. */}
        {imageCount > 1 ? (
          <CardGallery images={l.images} alt={l.title} />
        ) : l.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cardImage(l.images[0])} alt={l.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-semibold text-ink-faint">
            <Camera className="h-7 w-7" />
            No image yet
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/45 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 font-display text-[11px] font-semibold uppercase tracking-[0.08em] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_0_rgba(0,0,0,0.25)] ${
              l.transactionType === "rent" ? "bg-brand text-white" : "bg-gold text-ink"
            }`}
          >
            {transactionLabel}
          </span>
          {/* The real trust signal: this owner's ID and ownership proof were
              checked. It used to appear only on the detail page, after the
              buyer had already chosen what to open. */}
          {l.ownerVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-[0_2px_0_rgba(0,0,0,0.2)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified owner
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <FavoriteButton listingId={l.id} />
        </div>
        {/* Only for a lone photo. Past that the gallery's own dots occupy
            this corner and already say how many there are. */}
        {imageCount === 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/55 px-2 py-1 text-xs font-bold text-white backdrop-blur">
            <Camera className="h-3.5 w-3.5" /> {imageCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          {l.categoryName || "Listing"}
          {l.model === "A" && <span className="text-ink-faint"> · Exclusive owner</span>}
        </p>

        {/* Price leads: it is the first thing a buyer filters on, and it used
            to sit in white on the photo where a bright image swallowed it. */}
        <p className="stat-figure mt-1.5 text-2xl font-extrabold leading-tight text-ink">
          {formatRwf(l.price)}
          {l.transactionType === "rent" && <span className="font-body text-sm font-semibold tracking-normal text-ink-faint"> / month</span>}
        </p>

        <h3 className="mt-1.5 line-clamp-2 min-h-[2.75rem] font-body text-[15px] font-semibold leading-snug tracking-normal text-ink-soft">
          {l.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-brand" />
            <span className="truncate">{area}</span>
          </span>
          {l.itemType && <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-bold text-ink-soft">{l.itemType}</span>}
        </div>

        {features.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {features.map((feature) => (
              <span key={feature} className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-ink-soft">
                {feature}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          {/* Both models reveal the contact behind the same token payment, and
              neither says anything about the owner being verified. This slot
              read "Verified exclusive" / "Token unlock", which claimed a
              verification the model does not carry and implied only Model B
              cost the buyer anything. */}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <KeyRound className="h-4 w-4 text-clay" />
            Contact by token
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
            View
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand transition duration-300 group-hover:bg-brand group-hover:text-white">
              <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:rotate-45" />
            </span>
          </span>
        </div>
      </div>
    </MotionCard>
  );
}
