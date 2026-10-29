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
import AdminSectionNav from "./AdminSectionNav";

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

      <AdminSectionNav />

      {/* scroll-mt clears the sticky top bar and section nav when jumping. */}
      <div id="analytics" className="scroll-mt-36"><AnalyticsPanel /></div>
      <div id="verification" className="scroll-mt-36"><VerificationQueue /></div>
      <div id="reports" className="scroll-mt-36"><ReportsQueue /></div>
      <div id="moderation" className="scroll-mt-36"><ModerationQueue /></div>
      <div id="assignments" className="scroll-mt-36"><AssignmentsPanel /></div>
      <div id="drafts" className="scroll-mt-36"><DraftsPanel /></div>
      <div id="users" className="scroll-mt-36"><UsersPanel /></div>
      <div id="penalties" className="scroll-mt-36"><PenaltiesPanel /></div>
      <div id="audit" className="scroll-mt-36"><AuditViewer /></div>
    </div>
  );
}
