import { ROLES } from "./constants";

/** Where each role's "my dashboard" link should land. */
export const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.MANAGER]: "/dashboard/manager",
  [ROLES.OWNER]: "/dashboard",
  [ROLES.AGENT]: "/dashboard",
  [ROLES.BUYER]: "/dashboard",
};

export const dashboardPathFor = (role) => DASHBOARD_PATHS[role] || "/dashboard";
