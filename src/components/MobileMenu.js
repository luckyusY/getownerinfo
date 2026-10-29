"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, CarFront, HelpCircle, Inbox, LayoutDashboard,
  LogIn, LogOut, MapPin, MessageCircle, Tag, UserPlus,
} from "lucide-react";

// What the bottom tab bar does not already carry. Home and Browse used to be
// here too, but they are two of the five tabs, so the drawer repeated them.
const MAIN_NAV = [
  { label: "Requests", href: "/seekers", icon: Inbox },
  { label: "Pricing", href: "/pricing", icon: Tag },
  { label: "How it works", href: "/#how", icon: HelpCircle },
  { label: "Contact", href: "/contact", icon: MessageCircle },
];
import { POPULAR_LOCATIONS } from "@/data/locations";
import { useToast } from "@/components/ui/Toast";
import StartSellingButton from "@/components/StartSellingButton";

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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const displayName = session?.name || "My account";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  useEffect(() => setMounted(true), []);

  // Hold the page still behind the drawer, and close on Escape for the iPad
  // keyboard case. Without the lock, iOS chains the drawer's scroll into the
  // page behind it once the drawer hits its end.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // A route change should not leave the drawer open over the new page.
  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Signed out", { type: "info" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const overlay = (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[55] bg-ink/40 backdrop-blur-[1px] lg:hidden"
      />
      <nav
        aria-label="Menu"
        className="fixed inset-x-3 top-[var(--header-h)] z-[60] mt-2 max-h-[calc(100dvh-var(--header-h)-1.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-3 shadow-lift lg:hidden"
      >
        <div className="grid gap-1">
          {MAIN_NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition active:scale-[0.98] ${
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
              <Link key={label} href={href} onClick={() => setOpen(false)} className="grid min-h-16 place-items-center rounded-lg bg-panel px-2 py-2 text-center text-xs font-bold text-ink-soft transition active:scale-95">
                <Icon className="h-4 w-4 text-brand" /> {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Popular areas</p>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_LOCATIONS.slice(0, 6).map((loc) => (
              <Link key={loc.name} href={loc.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg bg-panel px-3 py-2 text-sm font-bold text-ink-soft transition active:scale-95">
                <MapPin className="h-4 w-4 shrink-0 text-brand" /> {loc.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
          {SECONDARY_NAV.map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center rounded-full bg-panel px-4 text-xs font-bold text-ink-soft transition active:scale-95">
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
              {session?.role === "buyer" && (
                <StartSellingButton className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/25 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-100 active:scale-[0.98]">
                  Start selling
                </StartSellingButton>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-[0.98]"
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
  );

  return (
    // lg, not md: PublicNav only appears at lg, so between 768 and 1023 this
    // button was hidden while the desktop nav had not arrived yet, leaving the
    // header with no navigation at all on a tablet.
    <div className="lg:hidden">
      <button
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-brand-dark active:scale-95"
      >
        <span className="relative block h-3 w-4">
          <span className={`absolute left-0 top-0 h-0.5 w-4 bg-current transition ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[5px] h-0.5 w-4 bg-current transition ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[10px] h-0.5 w-4 bg-current transition ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>

      {/*
        Rendered into body, not here. The header sets backdrop-blur, which makes
        it the containing block for any fixed descendant, so the backdrop's
        inset-0 used to resolve to the header's own 126px box: it measured 27px
        tall and tapping the page did not close the drawer. Being inside the
        header's z-40 stacking context also put the whole drawer under the
        cookie banner, which painted across the middle of it.
      */}
      {mounted && open && createPortal(overlay, document.body)}
    </div>
  );
}
