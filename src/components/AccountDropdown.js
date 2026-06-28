"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  CircleUser,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  MessageCircle,
  MessagesSquare,
  PlusCircle,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import StartSellingButton from "@/components/StartSellingButton";

const ROLE_LINKS = {
  buyer: [{ href: "/dashboard/buyer", icon: Heart, label: "Saved listings" }],
  owner: [
    { href: "/dashboard/owner", icon: ListChecks, label: "My listings" },
    { href: "/dashboard/owner/messages", icon: MessagesSquare, label: "Messages" },
    { href: "/dashboard/owner/listings/new", icon: PlusCircle, label: "New listing" },
  ],
  platform_listing_manager: [],
  admin: [],
};

export default function AccountDropdown({ session, dashboardPath = "/dashboard" }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast("Signed out", { type: "info" });
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      toast("Could not sign out. Try again.", { type: "error" });
    } finally {
      setLoggingOut(false);
    }
  }

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
    <div ref={menuRef} className="relative hidden md:block">
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
            {session.role === "buyer" && (
              <StartSellingButton className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-ink transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none">
                Start selling
              </StartSellingButton>
            )}
            {(ROLE_LINKS[session.role] || []).map((item) => (
              <MenuLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
            {session.role === "owner" && <MenuLink href="/listings" icon={Heart} label="Browse as buyer" />}
            <MenuLink href="/contact" icon={MessageCircle} label="Support" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Signing out…" : "Log out"}
            </button>
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
