import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import ModerationQueue from "./ModerationQueue";
import PenaltiesPanel from "./PenaltiesPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import AuditViewer from "./AuditViewer";

export default async function AdminDashboard() {
  guardRole(ROLES.ADMIN);
  await connectDB();

  const [pending, active, users] = await Promise.all([
    Listing.countDocuments({ status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
    User.countDocuments({}),
  ]);

  return (
    <div>
      <PageHeader title="Admin overview" subtitle="Verify listings, manage users, and oversee the platform." />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending approvals" value={pending} tone={pending ? "brand" : "default"} />
        <StatCard label="Active listings" value={active} />
        <StatCard label="Registered users" value={users} />
      </div>

      <AnalyticsPanel />
      <ModerationQueue />
      <PenaltiesPanel />
      <AuditViewer />
    </div>
  );
}
