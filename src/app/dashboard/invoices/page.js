import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { formatRwf } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import OwnerManage from "@/app/dashboard/owner/OwnerManage";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();
  const user = await User.findById(session.sub).select("commissionDue penaltyBalance").lean();

  const commissionDue = user?.commissionDue || 0;
  const penaltyBalance = user?.penaltyBalance || 0;
  const outstanding = commissionDue + penaltyBalance;

  return (
    <div id="commissions">
      <PageHeader
        title="Invoices & commissions"
        subtitle="Model A commissions on closed deals, and any penalties applied to this account."
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Commission due" value={formatRwf(commissionDue)} tone={commissionDue ? "danger" : "default"} />
        <StatCard label="Penalties outstanding" value={formatRwf(penaltyBalance)} tone={penaltyBalance ? "danger" : "default"} />
        <StatCard label="Total outstanding" value={formatRwf(outstanding)} tone={outstanding ? "danger" : "brand"} />
      </div>

      {outstanding > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-xs font-black">!</span>
          <span>
            New exclusive (Model A) listings are blocked until <strong>{formatRwf(outstanding)}</strong> is settled.
          </span>
        </div>
      )}

      <OwnerManage showListings={false} />
    </div>
  );
}
