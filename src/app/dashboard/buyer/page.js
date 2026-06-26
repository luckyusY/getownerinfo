import Link from "next/link";
import { connectDB } from "@/lib/db";
import TokenUnlock from "@/models/TokenUnlock";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

export default async function BuyerDashboard() {
  const session = guardRole(ROLES.BUYER);
  await connectDB();
  const unlocks = await TokenUnlock.find({ user: session.sub })
    .sort({ at: -1 })
    .populate({ path: "listing", model: Listing, select: "title price" })
    .lean();

  const spent = unlocks.reduce((s, u) => s + (u.amountPaid || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your activity</h1>
          <p className="mt-1 text-sm text-slate-600">
            {unlocks.length} unlock(s) · {money(spent)} spent on token fees
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/seekers/new" className="btn-outline">Post a request</Link>
          <Link href="/listings" className="btn-primary">Browse listings</Link>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Unlocked contacts</h2>
      {unlocks.length === 0 ? (
        <div className="mt-3 card text-center text-sm text-slate-500">
          You haven&apos;t unlocked any listings yet.
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Unlocked</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {unlocks.map((u) => (
                <tr key={u._id.toString()} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.listing?.title || "(removed)"}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{u.tier}</td>
                  <td className="px-4 py-3">{money(u.amountPaid)}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(u.at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {u.listing && (
                      <Link href={`/listings/${u.listing._id.toString()}`} className="text-brand hover:underline">
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
