import Link from "next/link";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import { formatRwf } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import OwnerManage from "./OwnerManage";

export default async function OwnerDashboard() {
  const session = guardRole(ROLES.OWNER);
  await connectDB();
  const [user, total, active, pending] = await Promise.all([
    User.findById(session.sub).lean(),
    Listing.countDocuments({ owner: session.sub }),
    Listing.countDocuments({ owner: session.sub, status: "active" }),
    Listing.countDocuments({ owner: session.sub, status: "pending_approval" }),
  ]);

  const outstanding = (user?.commissionDue || 0) + (user?.penaltyBalance || 0);

  return (
    <div>
      <PageHeader
        title="Your listings"
        subtitle="Create listings, track unlocks, report deals and settle commissions."
        actions={
          <>
            <Link href="/dashboard/owner/messages" className="btn-outline">Messages</Link>
            <Link href="/dashboard/owner/listings/new" className="btn-primary">+ New listing</Link>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total listings" value={total} />
        <StatCard label="Active" value={active} tone="brand" />
        <StatCard label="Pending approval" value={pending} />
      </div>

      {outstanding > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="text-lg">⚠</span>
          <span>
            You owe <strong>{formatRwf(outstanding)}</strong> in commission/penalties. Settle it below —
            new exclusive (Model A) listings are blocked until it&apos;s cleared.
          </span>
        </div>
      )}

      <OwnerManage />
    </div>
  );
}
