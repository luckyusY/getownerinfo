import { guardRole } from "@/lib/guardRole";
import { ROLES } from "@/lib/constants";
import ReportsQueue from "../ReportsQueue";

export const metadata = { title: "Reports · Admin" };

// One admin section per route. The panel is a client component that fetches
// its own data, so splitting the old single page means a section now loads
// only its own requests instead of all nine at once. The panel carries its
// own heading, so this page deliberately adds none.
export default function AdminReportsPage() {
  guardRole(ROLES.ADMIN);
  return <ReportsQueue />;
}
