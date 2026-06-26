import Link from "next/link";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import OwnerManage from "./OwnerManage";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your listings</h1>
          <p className="mt-1 text-sm text-slate-600">{total} total · {active} active · {pending} pending</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/owner/messages" className="btn-outline">Messages</Link>
          <Link href="/dashboard/owner/listings/new" className="btn-primary">+ New listing</Link>
        </div>
      </div>

      {outstanding > 0 && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You owe <strong>{money(outstanding)}</strong> in commission/penalties. Settle it below —
          new exclusive (Model A) listings are blocked until it&apos;s cleared.
        </div>
      )}

      <OwnerManage />
    </div>
  );
}
