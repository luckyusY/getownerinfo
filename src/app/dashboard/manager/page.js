import Link from "next/link";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";

export default async function ManagerDashboard() {
  guardRole(ROLES.MANAGER);
  await connectDB();
  const [pending, active] = await Promise.all([
    Listing.countDocuments({ status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
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
        <StatCard label="Assigned to you" value="-" hint="Assignment coming soon" />
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-sm leading-relaxed text-ink-soft shadow-soft">
        <p className="font-semibold text-ink">Verification workspace</p>
        <p className="mt-1">
          Listing assignment and document verification tools appear here as the platform grows.
          For now you can review the public listings catalogue.
        </p>
      </div>
    </div>
  );
}
