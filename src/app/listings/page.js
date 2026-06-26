import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import Category from "@/models/Category";
import { LISTING_STATUS } from "@/lib/constants";

function money(n) {
  return new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  await connectDB();
  // Ensure Category model is registered for any populate and name lookups.
  const [listings, categories] = await Promise.all([
    Listing.find({ status: LISTING_STATUS.ACTIVE }).sort({ createdAt: -1 }).limit(60).lean(),
    Category.find({}).lean(),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Browse listings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Contact details and exact location are unlocked with a token fee.
        </p>

        {listings.length === 0 ? (
          <div className="mt-8 card text-center text-sm text-slate-500">
            No active listings yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link
                key={l._id.toString()}
                href={`/listings/${l._id.toString()}`}
                className="card transition hover:shadow-md"
              >
                <div className="mb-3 aspect-video overflow-hidden rounded-lg bg-slate-100">
                  {l.images?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0].url} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">
                    {catName[l.category?.toString()] || "Listing"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {l.transactionType === "rent" ? "For rent" : "For sale"}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-slate-900">{l.title}</h3>
                <p className="text-sm text-slate-500">{l.location?.area || "Location on unlock"}</p>
                <p className="mt-1 font-bold text-brand">{money(l.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
