"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Home, Inbox, LayoutGrid, MessageCircle } from "lucide-react";

export const MAIN_NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse", href: "/listings", icon: LayoutGrid },
  { label: "Requests", href: "/seekers", icon: Inbox },
  { label: "How it works", href: "/#how", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: MessageCircle },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {MAIN_NAV.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`nav-link inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition hover:bg-panel hover:text-ink ${
              active ? "bg-brand-50 text-brand" : "text-ink-soft"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
