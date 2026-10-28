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
      items: [
        { label: "My Listings", href: "/dashboard/listings", icon: Home, count: counts.listings },
        { label: "New Listing", href: "/dashboard/owner/listings/new", icon: ListPlus },
        { label: "Active Listings", href: "/dashboard/listings?status=active", icon: BadgeCheck, count: counts.active },
        { label: "Pending Approval", href: "/dashboard/listings?status=pending_approval", icon: Clock, count: counts.pending },
        { label: "Drafts", href: "/dashboard/listings?status=draft", icon: FileText, count: counts.drafts },
        { label: "Expired", href: "/dashboard/listings?status=expired", icon: Archive },
        { label: "Sold / Rented", href: "/dashboard/listings?status=sold", icon: Store },
        { label: "Under Negotiation", href: "/dashboard/listings?status=under_negotiation", icon: Handshake },
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

function staffGroups(role) {
  if (role === ROLES.ADMIN) {
    return [
      {
        title: "Administration",
        items: [
          { label: "Overview", href: "/dashboard/admin", icon: ShieldCheck },
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
    ? [...staffGroups(role), ...commonGroups(counts)]
    : [...sellerGroups(counts), ...buyerGroups(counts), ...commonGroups(counts)];

  return (
    <nav aria-label="Dashboard" className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-3 shadow-soft">
      <NavItem
        href="/dashboard"
        icon={LayoutDashboard}
        label="Dashboard"
        active={pathname === "/dashboard"}
      />

      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-faint">
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

      <div className="border-t border-line pt-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </nav>
  );
}

function NavItem({ href, icon: Icon, label, count, verified, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
        active ? "bg-brand text-white shadow-soft" : "text-ink-soft hover:bg-brand-50 hover:text-brand"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span
          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black ${
            active ? "bg-white/20 text-white" : "bg-brand-50 text-brand"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
      {verified && !count && (
        <BadgeCheck className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-emerald-600"}`} />
      )}
    </Link>
  );
}
