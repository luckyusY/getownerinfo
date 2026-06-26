"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = {
  admin: [
    { href: "/dashboard/admin", label: "Overview", icon: "◆" },
    { href: "/listings", label: "Listings", icon: "▤" },
    { href: "/seekers", label: "Requests", icon: "✦" },
  ],
  platform_listing_manager: [
    { href: "/dashboard/manager", label: "Overview", icon: "◆" },
    { href: "/listings", label: "Listings", icon: "▤" },
  ],
  owner: [
    { href: "/dashboard/owner", label: "My listings", icon: "▤" },
    { href: "/dashboard/owner/listings/new", label: "New listing", icon: "＋" },
    { href: "/dashboard/owner/messages", label: "Messages", icon: "✉" },
  ],
  buyer: [
    { href: "/dashboard/buyer", label: "My activity", icon: "◆" },
    { href: "/listings", label: "Browse", icon: "▤" },
    { href: "/seekers/new", label: "Post a request", icon: "＋" },
  ],
};

export default function DashboardNav({ role }) {
  const pathname = usePathname();
  const items = NAV[role] || [];

  return (
    <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand text-white shadow-soft" : "text-ink-soft hover:bg-panel hover:text-ink"
            }`}
          >
            <span className={`text-base ${active ? "opacity-90" : "text-ink-faint"}`}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
