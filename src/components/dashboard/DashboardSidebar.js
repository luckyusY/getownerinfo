"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive, BadgeCheck, Banknote, Bell, Bookmark, Clock, Coins, FileText,
  Handshake, Home, Inbox, LayoutDashboard, ListChecks, ListPlus, LogOut,
  MessageSquareText, Receipt, Search, Settings, ShieldCheck, Store, Unlock,
  UserCircle,
} from "lucide-react";
import { ROLES } from "@/lib/constants";
import { ADMIN_SECTIONS, adminHref } from "@/lib/adminSections";

/**
 * Grouped dashboard navigation: one account, separate workspaces for selling,
 * buying, messages, payments and the account itself.
 *
 * `counts` is supplied by the dashboard layout so each entry can carry its own
 * live badge; a count of 0 renders no badge rather than a "0" pill.
 */
function sellerGroups(counts) {
  return [
    {
      title: "Listings (sell / let)",
      // The status entries are views of "My Listings", not destinations of
      // their own, so they are marked `sub` and drawn as a quieter, indented
      // list hanging off it. Flat, they were six of the sidebar's twenty-one
      // equally loud rows and pushed Messages and Payments below the fold.
      items: [
        { label: "New Listing", href: "/dashboard/owner/listings/new", icon: ListPlus },
        { label: "My Listings", href: "/dashboard/listings", icon: Home, count: counts.listings },
        { sub: true, label: "Active", href: "/dashboard/listings?status=active", icon: BadgeCheck, count: counts.active },
        { sub: true, label: "Pending approval", href: "/dashboard/listings?status=pending_approval", icon: Clock, count: counts.pending },
        { sub: true, label: "Drafts", href: "/dashboard/listings?status=draft", icon: FileText, count: counts.drafts },
        { sub: true, label: "Under negotiation", href: "/dashboard/listings?status=under_negotiation", icon: Handshake },
        { sub: true, label: "Sold / Rented", href: "/dashboard/listings?status=sold", icon: Store },
        { sub: true, label: "Expired", href: "/dashboard/listings?status=expired", icon: Archive },
      ],
    },
  ];
}

function buyerGroups(counts) {
  return [
    {
      title: "Buy / rent",
      items: [
        { label: "Browse Listings", href: "/listings", icon: Search },
        { label: "Saved Listings", href: "/dashboard/saved", icon: Bookmark, count: counts.saved },
        { label: "Contact Unlocks", href: "/dashboard/unlocks", icon: Unlock, count: counts.unlocks },
        { label: "My Requests", href: "/dashboard/requests", icon: ListChecks, count: counts.requests },
      ],
    },
  ];
}

function commonGroups(counts) {
  return [
    {
      title: "Messages",
      items: [
        { label: "Conversations", href: "/dashboard/messages", icon: MessageSquareText, count: counts.conversations },
        { label: "Notifications", href: "/dashboard/notifications", icon: Bell, count: counts.notifications },
      ],
    },
    {
      title: "Payments",
      items: [
        { label: "Payment History", href: "/dashboard/payments", icon: Banknote },
        { label: "My Tokens", href: "/dashboard/unlocks", icon: Coins, count: counts.unlocks },
        { label: "Invoices", href: "/dashboard/invoices", icon: Receipt, count: counts.invoices },
        { label: "Commissions", href: "/dashboard/invoices#commissions", icon: Handshake },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "My Profile", href: "/dashboard/profile", icon: UserCircle },
        { label: "Verification", href: "/dashboard/profile#verification", icon: ShieldCheck, verified: counts.verified },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];
}

function staffGroups(role, counts) {
  if (role === ROLES.ADMIN) {
    return [
      {
        // Every admin section is a route of its own, so the console is reachable
        // from the sidebar rather than by scrolling one long page.
        title: "Administration",
        items: [
          { label: "Overview", href: "/dashboard/admin", icon: ShieldCheck },
          ...ADMIN_SECTIONS.map(({ slug, label, icon, countKey }) => ({
            label,
            href: adminHref(slug),
            icon,
            count: countKey ? counts[countKey] : undefined,
          })),
        ],
      },
      {
        title: "Platform",
        items: [
          { label: "All Listings", href: "/listings", icon: Home },
          { label: "Seeker Requests", href: "/seekers", icon: Inbox },
        ],
      },
    ];
  }
  return [
    {
      title: "Assigned work",
      items: [
        { label: "Overview", href: "/dashboard/manager", icon: LayoutDashboard },
        { label: "Assigned Listings", href: "/dashboard/listings", icon: Home },
        { label: "Browse Listings", href: "/listings", icon: Search },
      ],
    },
  ];
}

/**
 * What staff keep from the shared groups. Admins and managers do not sell or
 * buy through their staff account, so the token, invoice and commission
 * entries that dominate an owner's sidebar would only be noise here — they
 * were what made a staff sidebar read almost exactly like a normal user's.
 */
function staffCommonGroups(counts) {
  return [
    {
      title: "Messages",
      items: [
        { label: "Conversations", href: "/dashboard/messages", icon: MessageSquareText, count: counts.conversations },
        { label: "Notifications", href: "/dashboard/notifications", icon: Bell, count: counts.notifications },
      ],
    },
    {
      title: "Account",
      items: [
        { label: "My Profile", href: "/dashboard/profile", icon: UserCircle },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ],
    },
  ];
}

export default function DashboardSidebar({ role, counts = {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  // Compare against the full path+query so "Active Listings" and "Drafts" can
  // both point at /dashboard/listings and still highlight independently.
  const current = status ? `${pathname}?status=${status}` : pathname;

  const isStaff = role === ROLES.ADMIN || role === ROLES.MANAGER;
  const groups = isStaff
    ? [...staffGroups(role, counts), ...staffCommonGroups(counts)]
    : [...sellerGroups(counts), ...buyerGroups(counts), ...commonGroups(counts)];

  return (
    <nav aria-label="Dashboard" className="dash-nav">
      <NavItem
        href="/dashboard"
        icon={LayoutDashboard}
        label="Dashboard"
        active={pathname === "/dashboard"}
      />

      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            {group.title}
          </p>
          <div className="grid gap-0.5">
            {group.items.map((item) => (
              <NavItem
                key={item.label}
                {...item}
                active={current === item.href || (item.href !== "/listings" && current === item.href.split("#")[0] && !status)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={logout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-200 active:scale-[0.98]"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </nav>
  );
}

/**
 * One sidebar row.
 *
 * The rail is dark, so the rows rest in dimmed white at semibold and only the
 * current page is lit: a raised brand key, the brightest thing in the rail.
 * With every row bold, as they once were, the page you were on was merely the
 * loudest of twenty.
 *
 * A `sub` row is a filtered view of the row above it: no icon, indented along
 * a hairline, and a little smaller — but still a full 44px target on touch.
 */
function NavItem({ href, icon: Icon, label, count, verified, active, sub = false }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex min-h-11 items-center gap-3 rounded-lg transition active:scale-[0.98] lg:min-h-0 ${
        sub ? "ml-[21px] border-l border-white/15 py-2 pl-[18px] pr-3 text-[13px] lg:py-1.5" : "px-3 py-2.5 text-sm lg:py-2"
      } ${sub ? "rounded-l-none" : ""} ${
        active
          ? `font-bold text-white ${sub ? "bg-white/10" : "dash-nav-active"}`
          : "font-semibold text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {/* Leading-edge rule: says "you are here" without filling the row. */}
      {active && sub && (
        <span
          aria-hidden="true"
          className="absolute -left-[2px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-sky"
        />
      )}
      {!sub && (
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            active ? "text-white" : "text-white/50 group-hover:text-white"
          }`}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span
          className={`stat-figure inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-white/10 text-white/80"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
      {verified && !count && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
    </Link>
  );
}
