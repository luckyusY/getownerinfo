import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import MobileMenu from "@/components/MobileMenu";
import HeaderSearch from "@/components/HeaderSearch";
import CategoryBar from "@/components/CategoryBar";
import AccountDropdown from "@/components/AccountDropdown";
import NotificationBell from "@/components/NotificationBell";
import GoogleOneTap from "@/components/GoogleOneTap";

const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.MANAGER]: "/dashboard/manager",
  [ROLES.OWNER]: "/dashboard/owner",
  [ROLES.BUYER]: "/dashboard/buyer",
};

export default function SiteHeader() {
  const session = getSession();
  const dashboardPath = session ? DASHBOARD_PATHS[session.role] : null;

  return (
    <header className="sticky top-0 z-40 shadow-lg shadow-black/10">
      {!session && <GoogleOneTap />}
      <div className="hidden bg-[#071c1f] px-3 py-1 text-center text-[11px] font-bold leading-[18px] text-white md:block">
        <span className="text-[#9fdcef]">Verified owners across Rwanda</span> - unlock direct contact in seconds.{" "}
        <Link href="/#how" className="text-[#9fdcef] underline-offset-2 hover:underline">HOW IT WORKS</Link>
      </div>

      <div className="hidden bg-[#0b5f86] text-white md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1 text-[10px] font-bold uppercase tracking-wide">
          <div className="flex gap-5">
            <Link href="/about" className="text-white/85 hover:text-white">About us</Link>
            <Link href="/pricing" className="text-white/85 hover:text-white">Pricing</Link>
            <Link href="/support" className="text-white/85 hover:text-white">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-white/85 hover:text-white">Contact</Link>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-white text-ink md:border-0 md:bg-gradient-to-b md:from-[#16a3cc] md:to-[#0b5f86] md:text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 sm:px-4 sm:py-2.5 md:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="getownerinfo home">
            <span className="flex h-10 w-[132px] items-center justify-center overflow-hidden rounded-full bg-white px-2.5 shadow-sm ring-1 ring-line md:h-14 md:w-[166px] md:px-4 md:shadow-[0_10px_24px_rgba(3,18,30,0.16)] md:ring-white/70">
              <img src="/brand/logo-getownerinfo-cropped-white.png" alt="" className="h-8 w-auto object-contain md:h-12" />
            </span>
          </Link>

          <HeaderSearch />

          <div className="flex items-center justify-end gap-2 sm:gap-5">
            {session && (
              <div className="hidden md:block">
                <NotificationBell />
              </div>
            )}

            <AccountDropdown session={session} dashboardPath={dashboardPath || "/dashboard"} />

            {session?.role === ROLES.BUYER && (
              <Link href="/dashboard/buyer" aria-label="Saved listings" className="hidden text-white hover:text-[#9fdcef] md:block">
                <Heart className="h-6 w-6" />
              </Link>
            )}
            <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} session={session} />
          </div>
        </div>
        <div className="px-3 pb-2 md:hidden">
          <Link
            href="/listings"
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-panel px-4 text-sm font-bold text-ink-soft shadow-sm"
          >
            <Search className="h-4 w-4 text-brand" />
            Search listings, areas, property
          </Link>
        </div>
      </div>

      <CategoryBar />
    </header>
  );
}
