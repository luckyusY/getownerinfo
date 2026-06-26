import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import TokenUnlock from "@/models/TokenUnlock";
import { getSession } from "@/lib/auth";
import { buildRevealedContact } from "@/lib/unlockService";
import { LISTING_STATUS, ROLES } from "@/lib/constants";
import UnlockPanel from "./UnlockPanel";
import ChatBox from "@/components/ChatBox";

function money(n) {
  return new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

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
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="aspect-video overflow-hidden rounded-xl bg-slate-100">
              {pub.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pub.images[0]} alt={pub.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No image</div>
              )}
            </div>
            {pub.images?.length > 1 && (
              <div className="mt-3 flex gap-2">
                {pub.images.slice(1, 6).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
                ))}
              </div>
            )}

            <h1 className="mt-6 text-2xl font-bold text-slate-900">{pub.title}</h1>
            <p className="text-sm text-slate-500">
              {category?.name} · {pub.itemType} · {pub.transactionType === "rent" ? "For rent" : "For sale"}
            </p>
            <p className="mt-3 text-2xl font-bold text-brand">{money(pub.price)}</p>

            {pub.description && <p className="mt-4 whitespace-pre-line text-slate-700">{pub.description}</p>}

            {pub.features?.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {pub.features.map((f) => (
                  <li key={f} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{f}</li>
                ))}
              </ul>
            )}

            {/* Buyers can chat with the owner. Contact info is blocked pre-unlock. */}
            {session?.role === ROLES.BUYER && (
              <div className="mt-8">
                <h2 className="mb-2 text-sm font-semibold text-slate-700">Ask the owner</h2>
                <ChatBox listingId={listing._id.toString()} side="buyer" />
              </div>
            )}
          </div>

          {/* Contact panel — locked until token unlock */}
          <aside>
            <div className="card sticky top-6">
              <p className="text-sm text-slate-500">Token fee unlocks direct contact</p>
              <div className="mt-3">
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
