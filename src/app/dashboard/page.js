import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.MANAGER]: "/dashboard/manager",
  [ROLES.OWNER]: "/dashboard/owner",
  // Agents sell on an owner's behalf and use the same workspace.
  [ROLES.AGENT]: "/dashboard/owner",
  [ROLES.BUYER]: "/dashboard/buyer",
};

export default function DashboardEntry() {
  const session = getSession();
  if (!session) redirect("/login");
  redirect(DASHBOARD_PATHS[session.role] || "/");
}
