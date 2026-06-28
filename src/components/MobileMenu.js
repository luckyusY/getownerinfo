"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CarFront, LayoutDashboard, LogIn, LogOut, MapPin, UserPlus } from "lucide-react";
import { MAIN_NAV } from "@/components/HeaderNav";
import { POPULAR_LOCATIONS } from "@/data/locations";
import { useToast } from "@/components/ui/Toast";

const SECONDARY_NAV = [
  ["About", "/about"],
  ["FAQ", "/faq"],
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MobileMenu({ loggedIn, dashboardPath, session }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const displayName = session?.name || "My account";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Signed out", { type: "info" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="md:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-brand-dark"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-4 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-[98px] z-40 bg-ink/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <nav className="fixed inset-x-3 top-[98px] z-50 max-h-[calc(100dvh-110px)] overflow-y-auto rounded-xl border border-line bg-surface p-3 shadow-lift">
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
                <div className="w-full">
                  <div className="mb-3 flex items-center gap-3 rounded-lg bg-brand-50 p-3">
                    {session?.avatarUrl ? (
                      <img src={session.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-black text-white">{displayInitial}</span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">{displayName}</p>
                      <p className="truncate text-xs font-semibold capitalize text-ink-soft">{session?.role || "account"}</p>
                    </div>
                  </div>
                  <Link href={dashboardPath} onClick={() => setOpen(false)} className="btn-primary w-full">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
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
