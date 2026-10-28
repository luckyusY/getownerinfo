import Link from "next/link";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";

export default async function ManagerDashboard() {
  const session = guardRole(ROLES.MANAGER);
  await connectDB();
  const assignedFilter = { assignedManager: session.sub };
  const [pending, active, assigned] = await Promise.all([
    Listing.countDocuments({ ...assignedFilter, status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ ...assignedFilter, status: LISTING_STATUS.ACTIVE }),
    Listing.countDocuments(assignedFilter),
  ]);

  return (
    <div>
      <PageHeader
        title="Listing manager"
        subtitle="Manage assigned listings, verify documents and assist owners."
        actions={<Link href="/listings" className="btn-primary">View listings</Link>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Awaiting verification" value={pending} tone={pending ? "brand" : "default"} />
        <StatCard label="Active listings" value={active} />
        <StatCard label="Assigned to you" value={assigned} />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-sm leading-relaxed text-ink-soft shadow-soft">
        <p className="font-semibold text-ink">Verification workspace</p>
        <p className="mt-1">
          Your dashboard shows only listings assigned to your account. Admins must assign a listing before you can review private files or help with conversations.
        </p>
      </div>
    </div>
  );
}
