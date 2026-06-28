import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, Eye, KeyRound, LayoutDashboard, Lock, MapPin, Store, UserPlus } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import TokenUnlock from "@/models/TokenUnlock";
import { getSession } from "@/lib/auth";
import { buildRevealedContact } from "@/lib/unlockService";
import { LISTING_STATUS, ROLES } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import UnlockPanel from "./UnlockPanel";
import Gallery from "./Gallery";
import ChatBox from "@/components/ChatBox";
import Badge from "@/components/ui/Badge";
import FavoriteButton from "@/components/FavoriteButton";
import ShareButton from "@/components/ShareButton";
import PropertyCard from "@/components/PropertyCard";

const UNLOCK_INCLUDES = [
  "Owner's full name & phone",
  "Keys manager / caretaker contact",
  "Exact address (UPI, street, map pin)",
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  try {
    await connectDB();
    const l = await Listing.findById(params.id).select("title description price status").lean();
    if (!l || l.status !== LISTING_STATUS.ACTIVE) return { title: "Listing" };
    return {
      title: l.title,
      description: (l.description || `${l.title} unlock verified owner contact with a token fee.`).slice(0, 160),
      openGraph: { title: l.title, description: `${formatRwf(l.price)} - getownerinfo` },
    };
  } catch {
    return { title: "Listing" };
  }
}

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
  const session = getSession();
  const isListingOwner = !!session && listing.owner.toString() === session.sub;
  const canMessageAsBuyer = !!session && !isListingOwner && [ROLES.BUYER, ROLES.OWNER].includes(session.role);
  const canUnlock = !!session && !isListingOwner && [ROLES.BUYER, ROLES.OWNER, ROLES.ADMIN].includes(session.role);
  let initialRevealed = null;

  if (session) {
    const unlock = await TokenUnlock.findOne({ user: session.sub, listing: listing._id });
    if (unlock) initialRevealed = buildRevealedContact(listing, unlock.watermark);
  }

  // Similar active listings in the same category (excluding this one).
  const similarDocs = await Listing.find({
    status: LISTING_STATUS.ACTIVE,
    category: listing.category,
    _id: { $ne: listing._id },
  }).sort({ createdAt: -1 }).limit(3).lean();
  const similar = similarDocs.map((l) => ({
    id: l._id.toString(),
    title: l.title,
    images: (l.images || []).map((m) => m.url),
    price: l.price,
    transactionType: l.transactionType,
    model: l.model,
    location: { area: l.location?.area || null },
    categoryName: category?.name || "Listing",
  }));

  // JSON-LD structured data for SEO / rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pub.title,
    description: (pub.description || pub.title).slice(0, 300),
    image: pub.images?.[0] ? [pub.images[0]] : undefined,
    category: category?.name,
    offers: {
      "@type": "Offer",
      price: pub.price,
      priceCurrency: "RWF",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <Gallery images={pub.images || []} title={pub.title} />

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge tone={pub.transactionType === "rent" ? "info" : "gold"}>
                {pub.transactionType === "rent" ? "For rent" : "For sale"}
              </Badge>
              {pub.model === "A" && <Badge tone="brand">Exclusive</Badge>}
              <span className="text-sm text-ink-faint">{category?.name} - {pub.itemType}</span>
            </div>

            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{pub.title}</h1>
            <p className="mt-2 font-display text-3xl font-semibold text-brand">{formatRwf(pub.price)}</p>

            {/* Trust signals */}
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Verified listing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-ink-faint" /> Posted {formatDate(listing.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-ink-faint" /> {listing.unlockCount ?? 0} unlock{(listing.unlockCount ?? 0) === 1 ? "" : "s"}
              </span>
              {pub.location?.area && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand" /> {pub.location.area}
                </span>
              )}
            </div>

            {/* Save / Share */}
            <div className="mt-4 flex flex-wrap gap-2">
              <FavoriteButton listingId={listing._id.toString()} variant="button" />
              <ShareButton title={pub.title} />
            </div>

            {pub.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-soft">{pub.description}</p>}

            {pub.features?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {pub.features.map((f) => (
                  <li key={f} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-soft">{f}</li>
                ))}
              </ul>
            )}

            {!session && (
              <div className="mt-8 rounded-xl border border-brand/20 bg-brand-50 p-4">
                <h2 className="font-display text-lg font-bold text-ink">Ready to contact the real owner?</h2>
                <p className="mt-1 text-sm text-ink-soft">Create an account to save listings, unlock verified contact details, or list your own property later.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/login" className="btn-primary"><UserPlus className="h-4 w-4" /> Sign in to unlock</Link>
                  <Link href="/register?role=owner" className="btn-outline"><Store className="h-4 w-4" /> List your property</Link>
                </div>
              </div>
            )}

            {isListingOwner && (
              <div className="mt-8 rounded-xl border border-line bg-panel p-4">
                <h2 className="font-display text-lg font-bold text-ink">This is your listing</h2>
                <p className="mt-1 text-sm text-ink-soft">Manage buyer interest, messages, and outcome reporting from your owner dashboard.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/dashboard/owner" className="btn-primary"><LayoutDashboard className="h-4 w-4" /> Manage listings</Link>
                  <Link href="/dashboard/owner/messages" className="btn-outline">Messages</Link>
                </div>
              </div>
            )}

            {canMessageAsBuyer && (
              <div className="mt-8">
                <h2 className="mb-2 font-display text-lg font-semibold text-ink">Ask the owner</h2>
                <ChatBox listingId={listing._id.toString()} side="buyer" />
              </div>
            )}
          </div>

          <aside className="md:col-span-2">
            <div className="card sticky top-20 premium-hover">
              {isListingOwner ? (
                <>
                  <p className="font-display text-base font-semibold text-ink">Owner controls</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Track unlocks and report deals from your dashboard.</p>
                  <div className="mt-4 grid gap-2">
                    <Link href="/dashboard/owner" className="btn-primary"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                    <Link href="/dashboard/owner/listings/new" className="btn-outline">Create another listing</Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-base font-semibold text-ink">Direct owner contact</p>
                  <p className="mt-0.5 text-sm text-ink-soft">A token fee reveals the verified owner&apos;s details.</p>
                  <div className="mt-4">
                    <UnlockPanel
                      listingId={listing._id.toString()}
                      loggedIn={canUnlock}
                      area={pub.location?.area}
                      initialRevealed={initialRevealed}
                      tokenFees={category?.tokenFee || null}
                    />
                  </div>
                </>
              )}

              {!isListingOwner && !initialRevealed && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
                    <Lock className="h-3.5 w-3.5" /> What you unlock
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {UNLOCK_INCLUDES.map((it) => (
                      <li key={it} className="flex items-start gap-2">
                        <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" /> {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Similar listings */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-bold text-ink">Similar listings</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((l) => <PropertyCard key={l.id} listing={l} />)}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
