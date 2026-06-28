"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  CircleUser,
  Heart,
  LayoutDashboard,
  LogIn,
  MessageCircle,
  PlusCircle,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

export default function AccountDropdown({ session, dashboardPath = "/dashboard" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const label = session ? "My Account" : "Sign in My Account";
  const displayName = session?.name || "My account";
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-sm font-bold text-white transition hover:text-[#9fdcef] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b77a0]"
      >
        {session?.avatarUrl ? (
          <img src={session.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-white/50 object-cover shadow-sm" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/50 bg-white/15 text-xs font-black shadow-sm">
            {session ? displayInitial : <CircleUser className="h-5 w-5" />}
          </span>
        )}
        <span className="max-w-[118px] text-left leading-tight">
          {session ? (
            <>
              <span className="block truncate">{displayName.split(" ")[0]}</span>
              <br />
              <span className="text-xs text-white/80">Account</span>
            </>
          ) : (
            <>
              Sign in
              <br />
              My Account
            </>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        role="menu"
        aria-label={label}
        className={`absolute right-0 top-full z-50 mt-3 overflow-hidden rounded-xl border border-white/20 bg-white text-ink shadow-lift ring-1 ring-black/5 transition ${
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        } ${session ? "w-64" : "w-72"}`}
      >
        {session ? (
          <>
            <div className="border-b border-line bg-brand-50 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-brand-dark">Signed in</p>
              <div className="mt-2 flex items-center gap-3">
                {session.avatarUrl ? (
                  <img src={session.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-sm font-black text-white">
                    {displayInitial}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink">{displayName}</p>
                  <p className="truncate text-xs font-semibold text-ink-soft">{session.email || `${session.role} account`}</p>
                </div>
              </div>
            </div>
            <MenuLink href={dashboardPath} icon={LayoutDashboard} label="Dashboard" />
            <MenuLink href="/dashboard/buyer" icon={Heart} label="Saved listings" />
            <MenuLink href="/contact" icon={MessageCircle} label="Support" />
          </>
        ) : (
          <>
            <div className="border-b border-line bg-gradient-to-r from-brand-50 to-white px-4 py-3">
              <p className="text-xs font-black uppercase tracking-wide text-brand-dark">Verified access</p>
              <p className="mt-0.5 text-sm font-semibold text-ink-soft">Sign in faster with Google or email.</p>
            </div>
            <MenuLink href="/login" icon={LogIn} label="Sign in" />
            <MenuLink href="/register" icon={UserPlus} label="Create buyer account" />
            <MenuLink href="/register?role=owner" icon={PlusCircle} label="List as owner" />
            <MenuLink href="/#how" icon={ShieldCheck} label="How verification works" />
          </>
        )}
      </div>
    </div>
  );
}

function MenuLink({ href, icon: Icon, label }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-bold transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none"
    >
      <Icon className="h-4 w-4 text-brand" />
      {label}
    </Link>
  );
}
