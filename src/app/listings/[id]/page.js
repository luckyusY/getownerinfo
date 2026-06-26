import { notFound } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import TokenUnlock from "@/models/TokenUnlock";
import { getSession } from "@/lib/auth";
import { buildRevealedContact } from "@/lib/unlockService";
import { LISTING_STATUS, ROLES } from "@/lib/constants";
import { formatRwf } from "@/lib/format";
import UnlockPanel from "./UnlockPanel";
import Gallery from "./Gallery";
import ChatBox from "@/components/ChatBox";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function ListingDetail({ params }) {
  await connectDB();
  let listing;
  try {
    listing = await Listing.findById(params.id);
  } catch {
    notFound();
  }
  if (!listing || listing.status !== LISTING_STATUS.ACTIVE) notFound();

  const category = await Category.findById(listing.category).lean();
  const pub = listing.toPublicJSON();

  // Has the signed-in user already unlocked this listing?
  const session = getSession();
  let initialRevealed = null;
  if (session) {
    const unlock = await TokenUnlock.findOne({ user: session.sub, listing: listing._id });
    if (unlock) initialRevealed = buildRevealedContact(listing, unlock.watermark);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/listings" className="text-sm text-ink-soft hover:text-ink">← Back to listings</Link>
        <div className="mt-4 grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <Gallery images={pub.images || []} title={pub.title} />

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone={pub.transactionType === "rent" ? "info" : "gold"}>
                {pub.transactionType === "rent" ? "For rent" : "For sale"}
              </Badge>
              {pub.model === "A" && <Badge tone="brand">Exclusive</Badge>}
              <span className="text-sm text-ink-faint">{category?.name} · {pub.itemType}</span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{pub.title}</h1>
            <p className="mt-2 font-display text-3xl font-semibold text-brand">{formatRwf(pub.price)}</p>

            {pub.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-ink-soft">{pub.description}</p>}

            {pub.features?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {pub.features.map((f) => (
                  <li key={f} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">{f}</li>
                ))}
              </ul>
            )}

            {/* Buyers can chat with the owner. Contact info is blocked pre-unlock. */}
            {session?.role === ROLES.BUYER && (
              <div className="mt-8">
                <h2 className="mb-2 font-display text-lg font-semibold text-ink">Ask the owner</h2>
                <ChatBox listingId={listing._id.toString()} side="buyer" />
              </div>
            )}
          </div>

          {/* Contact panel — locked until token unlock */}
          <aside className="md:col-span-2">
            <div className="card sticky top-20">
              <p className="font-display text-base font-semibold text-ink">Direct owner contact</p>
              <p className="mt-0.5 text-sm text-ink-soft">A token fee reveals the verified owner&apos;s details.</p>
              <div className="mt-4">
                <UnlockPanel
                  listingId={listing._id.toString()}
                  loggedIn={!!session}
                  area={pub.location?.area}
                  initialRevealed={initialRevealed}
                  tokenFees={category?.tokenFee || null}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
