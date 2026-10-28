import Link from "next/link";
import { ArrowRight, Bath, BedDouble, Camera, MapPin, Maximize2, Eye, Unlock } from "lucide-react";
import { formatRwf } from "@/lib/format";
import { cardImage } from "@/lib/imageUrl";
import FavoriteButton from "@/components/FavoriteButton";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_STYLE = {
  active: "bg-emerald-500 text-white",
  pending_approval: "bg-amber-400 text-amber-950",
  draft: "bg-violet-500 text-white",
  rejected: "bg-red-500 text-white",
  expired: "bg-ink-faint text-white",
  under_negotiation: "bg-sky text-white",
  sold: "bg-navy text-white",
  rented: "bg-navy text-white",
};

const STATUS_LABEL = {
  pending_approval: "Pending",
  under_negotiation: "Negotiating",
};

/** Up to three category-appropriate specs, read from the listing's attributes. */
function specsFor(listing) {
  const a = listing.attributes || {};
  const specs = [];
  if (a.bedrooms != null && a.bedrooms !== "") specs.push([BedDouble, `${a.bedrooms} Beds`]);
  if (a.bathrooms != null && a.bathrooms !== "") specs.push([Bath, `${a.bathrooms} Baths`]);
  if (a.sizeSqm != null && a.sizeSqm !== "") specs.push([Maximize2, `${a.sizeSqm} m²`]);
  if (!specs.length && listing.itemType) specs.push([Camera, listing.itemType]);
  return specs.slice(0, 3);
}

export default function RecentListings({ listings = [] }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">My Recent Listings</h2>
        <Link href="/dashboard/listings" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No listings yet"
            hint="Create your first listing to start receiving buyer and tenant interest."
            action={<Link href="/dashboard/owner/listings/new" className="btn-primary">New listing</Link>}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {listings.map((l) => {
            const isDraft = l.status === "draft" || l.status === "rejected";
            return (
              <article key={l.id} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:shadow-lift">
                <div className="relative aspect-[4/3] overflow-hidden bg-panel">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cardImage(l.image)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-xs font-semibold text-ink-faint">
                      <Camera className="h-6 w-6" />
                      No image yet
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${
                      STATUS_STYLE[l.status] || "bg-panel text-ink-soft"
                    }`}
                  >
                    {STATUS_LABEL[l.status] || l.status.replace(/_/g, " ")}
                  </span>
                  <div className="absolute right-2 top-2">
                    <FavoriteButton listingId={l.id} />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">{l.title}</h3>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-faint">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="truncate">{l.area || "Location on unlock"}</span>
                  </p>
                  <p className="mt-2 font-display text-lg font-bold text-ink">
                    {formatRwf(l.price)}
                    {l.transactionType === "rent" && <span className="text-sm font-semibold text-ink-faint"> / month</span>}
                  </p>

                  {specsFor(l).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-[11px] font-bold text-ink-soft">
                      {specsFor(l).map(([Icon, text]) => (
                        <span key={text} className="inline-flex items-center gap-1">
                          <Icon className="h-3.5 w-3.5 text-ink-faint" /> {text}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold text-ink-faint">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {l.views} views</span>
                    <span className="inline-flex items-center gap-1"><Unlock className="h-3.5 w-3.5" /> {l.unlocks} unlocks</span>
                  </div>

                  <Link
                    href={isDraft ? `/dashboard/owner/listings/new?draft=${l.id}` : `/listings/${l.id}`}
                    className={`mt-3 ${isDraft ? "btn-primary" : "btn-outline"} w-full !min-h-9 !py-1.5 !text-xs`}
                  >
                    {isDraft ? "Continue" : "View listing"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
