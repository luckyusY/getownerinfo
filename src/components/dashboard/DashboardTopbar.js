"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Bell, ChevronDown, FilePlus2, LayoutDashboard, LogOut, Menu,
  Plus, Search, Settings, ShieldCheck, UserCircle, X,
} from "lucide-react";

/**
 * Dashboard top bar: one search across listings, requests and messages, the two
 * primary create actions, notifications, and the account menu.
 */
export default function DashboardTopbar({ user, unreadCount = 0, onToggleSidebar, sidebarOpen }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function onSearch(e) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/listings?q=${encodeURIComponent(q)}` : "/listings");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = (user.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition hover:text-brand lg:hidden"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex shrink-0 items-center" aria-label="Get Owner Info home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-getownerinfo-cropped-white.png"
            alt="Get Owner Info"
            className="h-9 w-auto object-contain sm:h-11"
          />
        </Link>

        <form onSubmit={onSearch} className="hidden min-w-0 flex-1 md:block">
          <div className="input-wrap !min-h-11 !rounded-full bg-paper">
            <Search className="h-[18px] w-[18px] shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings, requests, messages..."
              aria-label="Search"
              className="w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink-faint"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard/owner/listings/new" className="btn-primary !rounded-full !px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Listing</span>
          </Link>
          <Link href="/seekers/new" className="btn-outline !rounded-full !px-4">
            <FilePlus2 className="h-4 w-4" />
            <span className="hidden lg:inline">Post a Request</span>
          </Link>

          <Link
            href="/dashboard/notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition hover:bg-brand-50 hover:text-brand"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2 transition hover:border-brand/40"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 text-sm font-black text-brand">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-bold text-ink">{user.name}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <BadgeCheck className="h-3 w-3" />
                  {user.isVerified ? "Verified User" : "Unverified"}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-faint" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-lift"
              >
                <div className="border-b border-line px-4 py-3">
                  <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                  <p className="truncate text-xs font-semibold text-ink-faint">{user.email}</p>
                </div>
                {[
                  ["/dashboard", LayoutDashboard, "Dashboard"],
                  ["/dashboard/profile", UserCircle, "My profile"],
                  ["/dashboard/profile#verification", ShieldCheck, "Verification"],
                  ["/dashboard/settings", Settings, "Settings"],
                ].map(([href, Icon, label]) => (
                  <Link
                    key={label}
                    href={href}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-brand-50 hover:text-brand"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
