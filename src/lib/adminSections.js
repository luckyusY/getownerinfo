import {
  BarChart3, BellRing, FileWarning, Gavel, History, ListChecks, ShieldCheck, Users, UserCog,
} from "lucide-react";

/**
 * The admin console's sections, in the order an admin works through them:
 * what needs a decision first (verification, reports, moderation), then the
 * people and records behind them.
 *
 * Single source of truth for the sidebar nav and the overview grid, so the two
 * cannot drift apart the way the old in-page chip bar drifted from the sidebar.
 */
export const ADMIN_SECTIONS = [
  {
    slug: "analytics",
    label: "Analytics",
    description: "Platform activity, listings and revenue at a glance.",
    icon: BarChart3,
  },
  {
    slug: "verification",
    label: "Verification",
    description: "Review identity documents and approve owner verification.",
    icon: ShieldCheck,
    countKey: "pendingKyc",
  },
  {
    slug: "reports",
    label: "Reports",
    description: "Listings and users flagged by the community.",
    icon: BellRing,
    countKey: "openReports",
  },
  {
    slug: "moderation",
    label: "Moderation",
    description: "Approve or reject listings waiting for review.",
    icon: ListChecks,
    countKey: "pending",
  },
  {
    slug: "assignments",
    label: "Assignments",
    description: "Assign listings to managers and track their workload.",
    icon: UserCog,
  },
  {
    slug: "drafts",
    label: "Incomplete",
    description: "Drafts that stalled before submission, and owners to nudge.",
    icon: FileWarning,
  },
  {
    slug: "users",
    label: "Users",
    description: "Search accounts, change roles, and suspend abuse.",
    icon: Users,
  },
  {
    slug: "penalties",
    label: "Penalties",
    description: "Commission penalties raised against owners.",
    icon: Gavel,
  },
  {
    slug: "audit",
    label: "Audit log",
    description: "Every administrative action, newest first.",
    icon: History,
  },
];

export const adminHref = (slug) => `/dashboard/admin/${slug}`;
