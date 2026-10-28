import Link from "next/link";
import {
  Bath, BedDouble, Camera, Fuel, Gauge, MapPin, Maximize2, Settings2, Sofa, SquareParking,
} from "lucide-react";
import { formatRwf } from "@/lib/format";
import { cardImage } from "@/lib/imageUrl";
import FavoriteButton from "@/components/FavoriteButton";

/**
 * Listing card used across the public site. The spec row adapts to the
 * category: rooms and size for property, drivetrain figures for vehicles.
 */
function specsFor(l) {
  const a = l.attributes || {};
  const specs = [];

  if (a.bedrooms != null && a.bedrooms !== "") specs.push([BedDouble, `${a.bedrooms} Beds`]);
  if (a.bathrooms != null && a.bathrooms !== "") specs.push([Bath, `${a.bathrooms} Baths`]);
  if (a.sizeSqm != null && a.sizeSqm !== "") specs.push([Maximize2, `${a.sizeSqm} m²`]);
  if (a.fuel) specs.push([Fuel, a.fuel]);
  if (a.transmission) specs.push([Settings2, a.transmission]);
  if (a.mileageKm != null && a.mileageKm !== "") {
    specs.push([Gauge, `${new Intl.NumberFormat("en-RW").format(a.mileageKm)} km`]);
  }
  if (a.furnishing) specs.push([Sofa, a.furnishing.replace(/_/g, " ")]);
  if (a.parking) specs.push([SquareParking, String(a.parking)]);

  if (!specs.length && l.itemType) specs.push([Camera, l.itemType]);
  return specs.slice(0, 3);
}

export default function ListingCard({ listing: l }) {
  const forRent = l.transactionType === "rent";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative">
      <Link href={`/listings/${l.id}`} className="block aspect-[4/3] overflow-hidden bg-panel">
        {l.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cardImage(l.images[0])}
            alt={l.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-xs font-semibold text-ink-faint">
            <Camera className="h-6 w-6" />
            No image yet
          </span>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-black text-white ${
            forRent ? "bg-brand" : "bg-emerald-500"
          }`}
        >
          {forRent ? "For Rent" : "For Sale"}
        </span>
      </Link>
        <div className="absolute right-3 top-3">
          <FavoriteButton listingId={l.id} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-display text-xl font-bold text-ink">
          {formatRwf(l.price)}
          {forRent && <span className="text-sm font-semibold text-ink-faint"> / month</span>}
        </p>

        <Link href={`/listings/${l.id}`} className="mt-1 block">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink transition group-hover:text-brand">
            {l.title}
          </h3>
        </Link>

        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="truncate">{l.location?.area || "Location on unlock"}</span>
        </p>

        {specsFor(l).length > 0 && (
          <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3 text-[11px] font-bold capitalize text-ink-soft">
            {specsFor(l).map(([Icon, text]) => (
              <span key={text} className="inline-flex items-center gap-1">
                <Icon className="h-3.5 w-3.5 text-ink-faint" /> {text}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
