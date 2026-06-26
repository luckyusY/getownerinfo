import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
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

  const cards = [
    { label: "Pending approvals", value: pending },
    { label: "Active listings", value: active },
    { label: "Registered users", value: users },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Admin overview</h1>
      <p className="mt-1 text-slate-600">Verify listings, manage users, and oversee the platform.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <AnalyticsPanel />
      <ModerationQueue />
      <PenaltiesPanel />
      <AuditViewer />
    </div>
  );
}
