"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CarFront, LayoutDashboard, LogIn, MapPin, UserPlus } from "lucide-react";
import { MAIN_NAV } from "@/components/HeaderNav";
import { POPULAR_LOCATIONS } from "@/data/locations";

const SECONDARY_NAV = [
  ["About", "/about"],
  ["FAQ", "/faq"],
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileMenu({ loggedIn, dashboardPath }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink shadow-soft transition hover:border-brand/40 hover:text-brand"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-4 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[57px] z-40 bg-ink/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <nav className="absolute inset-x-3 top-full z-50 rounded-b-xl border border-line bg-surface p-3 shadow-lift">
            <div className="grid gap-1">
              {MAIN_NAV.map(({ label, href, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                      active ? "bg-brand-50 text-brand" : "text-ink-soft hover:bg-panel hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Browse fast</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Property", "/listings?category=real-estate", Building2],
                  ["Vehicles", "/listings?category=vehicles", CarFront],
                  ["Areas", "/#locations", MapPin],
                ].map(([label, href, Icon]) => (
                  <Link key={label} href={href} onClick={() => setOpen(false)} className="grid min-h-16 place-items-center rounded-lg bg-panel px-2 py-2 text-center text-xs font-bold text-ink-soft">
                    <Icon className="h-4 w-4 text-brand" /> {label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Popular areas</p>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
                  <Link key={loc.name} href={loc.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg bg-panel px-3 py-2 text-sm font-bold text-ink-soft">
                    <MapPin className="h-4 w-4 text-brand" /> {loc.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
              {SECONDARY_NAV.map(([label, href]) => (
                <Link key={label} href={href} onClick={() => setOpen(false)} className="rounded-full bg-panel px-3 py-1.5 text-xs font-bold text-ink-soft">
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex gap-2 border-t border-line pt-3">
              {loggedIn ? (
                <Link href={dashboardPath} onClick={() => setOpen(false)} className="btn-primary flex-1">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-outline flex-1">
                    <LogIn className="h-4 w-4" /> Log in
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">
                    <UserPlus className="h-4 w-4" /> Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
