"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, HelpCircle, Home, Inbox, LayoutGrid, MapPin, MessageCircle, Tag } from "lucide-react";
import { POPULAR_LOCATIONS } from "@/data/locations";

export const MAIN_NAV = [
  { label: "Home", href: "/", icon: Home },
  { label: "Browse", href: "/listings", icon: LayoutGrid },
  { label: "Requests", href: "/seekers", icon: Inbox },
  { label: "Pricing", href: "/pricing", icon: Tag },
  { label: "How it works", href: "/#how", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: MessageCircle },
];

const DEPARTMENTS = [
  {
    label: "Listings",
    href: "/listings",
    columns: [
      ["Property", "Real Estate", "Furniture", "Appliances"],
      ["Vehicles", "Cars", "Motorcycles", "Business assets"],
      ["Trust", "Exclusive owners", "Token unlock", "Verified proof"],
    ],
    promo: "Browse verified owner listings, then unlock exact contact only when ready.",
  },
  {
    label: "Locations",
    href: "/#locations",
    columns: [
      ["Popular", "Kacyiru", "Nyarutarama", "Kibagabaga"],
      ["Central", "Kimihurura", "Kiyovu", "Remera"],
      ["Growth", "Rebero", "Kicukiro", "Kagarama"],
    ],
    promo: "Search by neighborhood and keep exact location protected until unlock.",
  },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(null);
  const activeDepartment = DEPARTMENTS.find((item) => item.label === open);

  return (
    <nav onMouseLeave={() => setOpen(null)} className="relative hidden xl:block">
      <div className="flex items-center gap-1">
        {MAIN_NAV.slice(0, 4).map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          const department = DEPARTMENTS.find((item) => item.label === label || (label === "Browse" && item.label === "Listings"));
          return (
            <Link
              key={label}
              href={href}
              onMouseEnter={() => setOpen(department?.label || null)}
              onFocus={() => setOpen(department?.label || null)}
              aria-current={active ? "page" : undefined}
              className={`nav-link inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition hover:bg-panel hover:text-ink ${
                active ? "bg-brand-50 text-brand" : "text-ink-soft"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {department && <ChevronDown className="h-3.5 w-3.5" />}
            </Link>
          );
        })}
      </div>

      {activeDepartment && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(820px,calc(100vw-32px))] rounded-xl border border-line bg-surface p-5 text-ink shadow-lift">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-ink">{activeDepartment.label}</h3>
                <Link href={activeDepartment.href} className="text-sm font-bold text-brand">See all</Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {activeDepartment.columns.map((column) => (
                  <div key={column[0]}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">{column[0]}</p>
                    <div className="grid gap-2">
                      {column.slice(1).map((label) => (
                        <Link
                          key={label}
                          href={activeDepartment.label === "Locations" ? `/listings?location=${encodeURIComponent(label)}` : activeDepartment.href}
                          className="rounded-lg border border-line bg-panel/55 p-3 text-sm font-bold text-ink-soft transition hover:border-brand/45 hover:bg-brand-50 hover:text-brand"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-ink p-5 text-white">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand">
                <MapPin className="h-3.5 w-3.5" /> Popular areas
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/76">{activeDepartment.promo}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {POPULAR_LOCATIONS.slice(0, 4).map((loc) => (
                  <Link key={loc.name} href={loc.href} className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/16">
                    {loc.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
