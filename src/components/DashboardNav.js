"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = {
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: "01" },
    { href: "/listings", label: "Listings", icon: "02" },
    { href: "/seekers", label: "Requests", icon: "03" },
  ],
  platform_listing_manager: [
    { href: "/dashboard/manager", label: "Overview", icon: "01" },
    { href: "/listings", label: "Listings", icon: "02" },
  ],
  owner: [
    { href: "/dashboard/owner", label: "My listings", icon: "01" },
    { href: "/dashboard/owner/listings/new", label: "New listing", icon: "02" },
    { href: "/dashboard/owner/messages", label: "Messages", icon: "03" },
  ],
  buyer: [
    { href: "/dashboard/buyer", label: "My activity", icon: "01" },
    { href: "/listings", label: "Browse", icon: "02" },
    { href: "/seekers/new", label: "Post a request", icon: "03" },
  ],
};

export default function DashboardNav({ role }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-2 shadow-soft md:flex-col">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
              active ? "bg-ink text-white shadow-soft" : "text-ink-soft hover:bg-panel hover:text-ink"
            }`}
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] ${
              active ? "bg-white/15 text-white" : "bg-panel text-ink-faint"
            }`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
