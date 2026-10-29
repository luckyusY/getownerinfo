import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Report from "@/models/Report";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import ModerationQueue from "./ModerationQueue";
import VerificationQueue from "./VerificationQueue";
import ReportsQueue from "./ReportsQueue";
import PenaltiesPanel from "./PenaltiesPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import AuditViewer from "./AuditViewer";
import UsersPanel from "./UsersPanel";
import AssignmentsPanel from "./AssignmentsPanel";
import DraftsPanel from "./DraftsPanel";

export default async function AdminDashboard() {
  guardRole(ROLES.ADMIN);
  await connectDB();

  const [pending, active, users, pendingKyc, openReports] = await Promise.all([
    Listing.countDocuments({ status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
    User.countDocuments({}),
    User.countDocuments({ "kyc.status": "pending" }),
    Report.countDocuments({ status: "open" }),
  ]);

  return (
    <div>
      <PageHeader title="Admin overview" subtitle="Verify listings, manage users, and oversee the platform." />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending approvals" value={pending} tone={pending ? "brand" : "default"} />
        <StatCard label="Awaiting verification" value={pendingKyc} tone={pendingKyc ? "brand" : "default"} />
        <StatCard label="Open reports" value={openReports} tone={openReports ? "brand" : "default"} />
        <StatCard label="Active listings" value={active} />
        <StatCard label="Registered users" value={users} />
      </div>

      <AnalyticsPanel />
      <VerificationQueue />
      <ReportsQueue />
      <ModerationQueue />
      <AssignmentsPanel />
      <DraftsPanel />
      <UsersPanel />
      <PenaltiesPanel />
      <AuditViewer />
    </div>
  );
}
