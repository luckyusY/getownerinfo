import Link from "next/link";
import { MessageSquareText, ShieldCheck } from "lucide-react";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import Category from "@/models/Category";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard, SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import ManagerListings from "./ManagerListings";

export const dynamic = "force-dynamic";

export default async function ManagerDashboard() {
  const session = guardRole(ROLES.MANAGER);
  await connectDB();

  // Everything on this page is scoped to listings assigned to this manager.
  // A manager never sees platform-wide revenue or unassigned work.
  const scope = { assignedManager: session.sub };

  const [listings, categories, pending, active, negotiating] = await Promise.all([
    Listing.find(scope).populate("owner", "name email phone isVerified kyc.status").sort({ updatedAt: -1 }).limit(50),
    Category.find({}).select("name").lean(),
    Listing.countDocuments({ ...scope, status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ ...scope, status: LISTING_STATUS.ACTIVE }),
    Listing.countDocuments({ ...scope, status: LISTING_STATUS.UNDER_NEGOTIATION }),
  ]);

  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));
  const listingIds = listings.map((l) => l._id);

  const [conversations, unreadRows] = await Promise.all([
    Conversation.find({ listing: { $in: listingIds } })
      .populate("buyer", "name")
      .populate("listing", "title")
      .sort({ lastMessageAt: -1 })
      .limit(10)
      .lean(),
    Conversation.countDocuments({ listing: { $in: listingIds } }),
  ]);

  // The distinct owners this manager looks after.
  const owners = [];
  const seen = new Set();
  for (const l of listings) {
    const id = l.owner?._id?.toString();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    owners.push({
      id,
      name: l.owner.name,
      email: l.owner.email,
      phone: l.owner.phone || null,
      isVerified: Boolean(l.owner.isVerified),
      kycStatus: l.owner.kyc?.status || "none",
      listings: listings.filter((x) => x.owner?._id?.toString() === id).length,
    });
  }

  return (
    <div>
      <PageHeader
        title="Listing manager"
        subtitle="Your assigned listings, the owners behind them, and the buyer conversations on those listings."
        actions={<Link href="/listings" className="btn-outline">Browse public listings</Link>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned to you" value={listings.length} tone="brand" />
        <StatCard label="Awaiting approval" value={pending} tone={pending ? "brand" : "default"} />
        <StatCard label="Active" value={active} />
        <StatCard label="Under negotiation" value={negotiating} />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft shadow-soft">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <span>
          Your access is limited to listings an admin has assigned to you. Platform revenue, user
          management and pricing settings are admin-only.
        </span>
      </div>

      <ManagerListings
        listings={listings.map((l) => ({
          id: l._id.toString(),
          title: l.title,
          status: l.status,
          model: l.model,
          price: l.price,
          transactionType: l.transactionType,
          categoryName: catName[l.category?.toString()] || "Listing",
          area: l.location?.area || null,
          ownerName: l.owner?.name || "Unknown",
          unlockCount: l.unlockCount || 0,
          viewCount: l.viewCount || 0,
          proofCount: l.ownershipProof?.length || 0,
          updatedAt: l.updatedAt?.toISOString() || null,
        }))}
      />

      <section className="mt-10">
        <SectionHeading
          title="Owners in your scope"
          description="The sellers behind your assigned listings, with their verification state."
        />
        {owners.length === 0 ? (
          <EmptyState title="No owners yet" hint="Owners appear here once listings are assigned to you." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {owners.map((o) => (
              <div key={o.id} className="card !p-4">
                <p className="font-display text-base font-bold text-ink">{o.name}</p>
                <p className="text-xs font-semibold text-ink-faint">{o.email}</p>
                {o.phone && <p className="text-xs font-semibold text-ink-faint">{o.phone}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black">
                  <span className={`rounded-full px-2 py-1 ${o.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {o.isVerified ? "ID verified" : `KYC ${o.kycStatus}`}
                  </span>
                  <span className="rounded-full bg-panel px-2 py-1 text-ink-soft">
                    {o.listings} assigned listing{o.listings === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeading
          title="Buyer conversations"
          description={`${unreadRows} thread${unreadRows === 1 ? "" : "s"} on your assigned listings.`}
          action={<Link href="/dashboard/messages" className="btn-outline">Open messages</Link>}
        />
        {conversations.length === 0 ? (
          <EmptyState title="No conversations yet" hint="Buyer questions on your assigned listings appear here." />
        ) : (
          <div className="grid gap-2">
            {conversations.map((c) => (
              <Link
                key={c._id.toString()}
                href={`/listings/${c.listing?._id?.toString()}`}
                className="flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-brand/40"
              >
                <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{c.listing?.title || "Listing"}</span>
                  <span className="block truncate text-xs font-semibold text-ink-faint">
                    {c.buyer?.name || "Buyer"} — {c.lastMessagePreview || "No preview"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
