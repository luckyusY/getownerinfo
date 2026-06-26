import DashboardShell from "@/components/DashboardShell";
import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";

export default function ManagerDashboard() {
  guardRole(ROLES.MANAGER);
  return (
    <DashboardShell
      title="Listing manager"
      subtitle="Manage assigned listings, verify documents and assist owners."
      cards={[
        { label: "Assigned listings", value: "—" },
        { label: "Awaiting verification", value: "—" },
        { label: "Token unlocks (assigned)", value: "—" },
      ]}
    />
  );
}
