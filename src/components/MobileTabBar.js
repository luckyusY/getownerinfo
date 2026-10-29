"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageCircle, Plus, Search, User } from "lucide-react";

/**
 * App-style bottom tab bar, phones and tablets only.
 *
 * The four corner tabs are the destinations people return to; posting sits in
 * the middle on a raised button because it is the one action the site wants,
 * and the thumb reaches the centre most easily.
 *
 * Signed-out visitors still see every tab — tapping one sends them to login
 * with `next`, so they land where they meant to go rather than on a dashboard
 * they did not ask for.
 */
export default function MobileTabBar({ loggedIn = false, dashboardPath = "/dashboard" }) {
  const pathname = usePathname();

  // Login bounces back to where the tap was heading.
  const gated = (href) => (loggedIn ? href : `/login?next=${encodeURIComponent(href)}`);

  const tabs = [
    { label: "Home", href: "/", icon: LayoutGrid, match: (p) => p === "/" },
    { label: "Browse", href: "/listings", icon: Search, match: (p) => p.startsWith("/listings") },
    {
      label: "Post",
      href: gated("/dashboard/owner/listings/new"),
      icon: Plus,
      center: true,
      match: (p) => p.includes("/listings/new"),
    },
    {
      label: "Messages",
      href: gated("/dashboard/messages"),
      icon: MessageCircle,
      match: (p) => p.includes("/messages"),
    },
    {
      label: "Account",
      href: gated(dashboardPath),
      icon: User,
      match: (p) => p.startsWith("/dashboard") && !p.includes("/messages") && !p.includes("/listings/new"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ label, href, icon: Icon, center, match }) => {
          const active = match(pathname);

          if (center) {
            return (
              <li key={label} className="flex justify-center">
                <Link
                  href={href}
                  aria-label="Post a listing"
                  aria-current={active ? "page" : undefined}
                  className="-mt-5 flex h-[60px] w-[60px] flex-col items-center justify-center gap-0.5 rounded-full border-4 border-paper bg-brand text-white shadow-lift transition active:scale-95"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px] font-black uppercase tracking-wide">{label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-bold transition ${
                  active ? "text-brand" : "text-ink-faint"
                }`}
              >
                <Icon className={`h-[22px] w-[22px] ${active ? "stroke-[2.4]" : ""}`} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
