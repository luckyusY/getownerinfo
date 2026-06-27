"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Home, Inbox, LayoutDashboard, ListPlus, MessageSquareText, Search, ShieldCheck } from "lucide-react";

const NAV = {
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: ShieldCheck },
    { href: "/listings", label: "Listings", icon: Home },
    { href: "/seekers", label: "Requests", icon: Inbox },
  ],
  platform_listing_manager: [
    { href: "/dashboard/manager", label: "Overview", icon: Activity },
    { href: "/listings", label: "Listings", icon: Home },
  ],
  owner: [
    { href: "/dashboard/owner", label: "My listings", icon: LayoutDashboard },
    { href: "/dashboard/owner/listings/new", label: "New listing", icon: ListPlus },
    { href: "/dashboard/owner/messages", label: "Messages", icon: MessageSquareText },
  ],
  buyer: [
    { href: "/dashboard/buyer", label: "My activity", icon: Activity },
    { href: "/listings", label: "Browse", icon: Search },
    { href: "/seekers/new", label: "Post a request", icon: Inbox },
  ],
};

export default function DashboardNav({ role }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-2 shadow-soft md:flex-col">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
              active ? "bg-ink text-white shadow-soft" : "text-ink-soft hover:bg-panel hover:text-ink"
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] ${
              active ? "bg-white/15 text-white" : "bg-panel text-ink-faint"
            }`}>
              <Icon className="h-4 w-4 transition group-hover:scale-110" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
