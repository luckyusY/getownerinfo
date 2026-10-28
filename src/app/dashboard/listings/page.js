import Link from "next/link";
import { ListPlus } from "lucide-react";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import { guardRole } from "@/lib/guardRole";
import { ROLES, SELLER_ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Dashboard";
import OwnerManage from "@/app/dashboard/owner/OwnerManage";

export const dynamic = "force-dynamic";

// The sidebar's listing sections, in the order the review asks for them.
const FILTERS = [
  { value: null, label: "All" },
  { value: LISTING_STATUS.ACTIVE, label: "Active" },
  { value: LISTING_STATUS.PENDING_APPROVAL, label: "Pending approval" },
  { value: LISTING_STATUS.DRAFT, label: "Drafts" },
  { value: LISTING_STATUS.UNDER_NEGOTIATION, label: "Under negotiation" },
  { value: LISTING_STATUS.SOLD, label: "Sold / Rented" },
  { value: LISTING_STATUS.EXPIRED, label: "Expired" },
  { value: LISTING_STATUS.REJECTED, label: "Rejected" },
];

export default async function MyListingsPage({ searchParams }) {
  const session = guardRole([...SELLER_ROLES, ROLES.MANAGER, ROLES.ADMIN]);
  await connectDB();

  const active = FILTERS.some((f) => f.value === searchParams?.status) ? searchParams.status : null;

  const scope =
    session.role === ROLES.ADMIN
      ? {}
      : session.role === ROLES.MANAGER
        ? { assignedManager: session.sub }
        : { owner: session.sub };

  // Counts for the filter chips, so each tab shows its own size.
  const counts = Object.fromEntries(
    await Promise.all(
      FILTERS.map(async (f) => {
        if (!f.value) return ["all", await Listing.countDocuments(scope)];
        const match =
          f.value === LISTING_STATUS.SOLD
            ? { status: { $in: [LISTING_STATUS.SOLD, LISTING_STATUS.RENTED] } }
            : { status: f.value };
        return [f.value, await Listing.countDocuments({ ...scope, ...match })];
      })
    )
  );

  return (
    <div>
      <PageHeader
        title="My listings"
        subtitle="Every listing on this account, grouped by where it is in the process."
        actions={
          <Link href="/dashboard/owner/listings/new" className="btn-primary">
            <ListPlus className="h-4 w-4" /> New listing
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = f.value === active;
          const count = counts[f.value || "all"] ?? 0;
          return (
            <Link
              key={f.label}
              href={f.value ? `/dashboard/listings?status=${f.value}` : "/dashboard/listings"}
              data-active={isActive}
              className="chip"
            >
              {f.label}
              <span className={`text-xs font-black ${isActive ? "text-white/80" : "text-ink-faint"}`}>{count}</span>
            </Link>
          );
        })}
      </div>

      <OwnerManage status={active} showFinance={false} />
    </div>
  );
}
