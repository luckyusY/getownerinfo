import Link from "next/link";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import TokenUnlock from "@/models/TokenUnlock";
import Favorite from "@/models/Favorite";
import SeekerRequest from "@/models/SeekerRequest";
import Conversation from "@/models/Conversation";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import { formatRwf } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import OwnerManage from "./OwnerManage";
import { BadgeCheck, Eye, Heart, ListPlus, MessageSquareText, Search, ShieldCheck } from "lucide-react";

export default async function OwnerDashboard() {
  const session = guardRole(ROLES.OWNER);
  await connectDB();
  const [user, total, active, pending, rejected, unlocks, conversations, savedCount, requestCount] = await Promise.all([
    User.findById(session.sub).lean(),
    Listing.countDocuments({ owner: session.sub }),
    Listing.countDocuments({ owner: session.sub, status: "active" }),
    Listing.countDocuments({ owner: session.sub, status: "pending_approval" }),
    Listing.countDocuments({ owner: session.sub, status: "rejected" }),
    TokenUnlock.countDocuments({ owner: session.sub }),
    Conversation.countDocuments({ owner: session.sub }),
    Favorite.countDocuments({ user: session.sub }),
    SeekerRequest.countDocuments({ seeker: session.sub }),
  ]);

  const outstanding = (user?.commissionDue || 0) + (user?.penaltyBalance || 0);
  const sellerReady = [user?.name, user?.email, user?.phone].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Your listings"
        subtitle="Create listings, track unlocks, report deals and settle commissions."
        actions={
          <>
            <Link href="/dashboard/owner/messages" className="btn-outline"><MessageSquareText className="h-4 w-4" /> Messages</Link>
            <Link href="/dashboard/owner/listings/new" className="btn-primary"><ListPlus className="h-4 w-4" /> New listing</Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total listings" value={total} />
        <StatCard label="Active" value={active} tone="brand" />
        <StatCard label="Pending approval" value={pending} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="card dashboard-reveal !p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-brand">Seller workspace</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink">You can buy and sell with one account.</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Your seller tools are active. Listings still go through proof review before buyers can unlock owner details.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg bg-panel p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Profile basics</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{sellerReady}/3</p>
            </div>
            <div className="rounded-lg bg-panel p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Account status</p>
              <p className="mt-1 inline-flex items-center gap-1.5 font-bold text-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Active
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="card dashboard-reveal !p-4">
            <p className="flex items-center gap-2 text-sm font-black text-ink"><Eye className="h-4 w-4 text-brand" /> Buyer interest</p>
            <p className="mt-2 text-3xl font-bold text-ink">{unlocks}</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Contact unlocks across your listings.</p>
          </div>
          <div className="card dashboard-reveal !p-4">
            <p className="flex items-center gap-2 text-sm font-black text-ink"><MessageSquareText className="h-4 w-4 text-brand" /> Conversations</p>
            <p className="mt-2 text-3xl font-bold text-ink">{conversations}</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Buyer threads linked to your listings.</p>
          </div>
          <div className="card dashboard-reveal !p-4">
            <p className="flex items-center gap-2 text-sm font-black text-ink"><Search className="h-4 w-4 text-brand" /> Buying activity</p>
            <p className="mt-2 text-sm font-bold text-ink">{savedCount} saved · {requestCount} requests</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Your previous buyer activity stays with this account.</p>
          </div>
          <div className="card dashboard-reveal !p-4">
            <p className="flex items-center gap-2 text-sm font-black text-ink"><Heart className="h-4 w-4 text-brand" /> Listing health</p>
            <p className="mt-2 text-sm font-bold text-ink">{active} active · {pending} pending · {rejected} rejected</p>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Keep proof complete for faster approvals.</p>
          </div>
        </section>
      </div>

      {outstanding > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold">!</span>
          <span>
            You owe <strong>{formatRwf(outstanding)}</strong> in commission/penalties. Settle it below.
            New exclusive (Model A) listings are blocked until it is cleared.
          </span>
        </div>
      )}

      <OwnerManage />
    </div>
  );
}
