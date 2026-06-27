import Link from "next/link";
import { ChevronDown, CircleUser, Heart, MessageCircle, Phone } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import MobileMenu from "@/components/MobileMenu";
import HeaderSearch from "@/components/HeaderSearch";
import CategoryBar from "@/components/CategoryBar";

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
      {/* Announcement */}
      <div className="bg-[#071c1f] px-3 py-1 text-center text-[11px] font-bold leading-[18px] text-white">
        <span className="text-[#9fdcef]">Verified owners across Rwanda</span> — unlock direct contact in seconds.{" "}
        <Link href="/#how" className="text-[#9fdcef] underline-offset-2 hover:underline">HOW IT WORKS</Link>
      </div>

      {/* Utility bar */}
      <div className="hidden bg-[#0b5f86] text-white sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1 text-[10px] font-bold uppercase tracking-wide">
          <div className="flex gap-5">
            <Link href="/about" className="text-white/85 hover:text-white">About us</Link>
            <Link href="/pricing" className="text-white/85 hover:text-white">Pricing</Link>
            <Link href="/support" className="text-white/85 hover:text-white">Support</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+250788385831" className="text-white/85 hover:text-white">+250 788 385 831</a>
            <a href="https://wa.me/250788385831" target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">WhatsApp</a>
            <Link href="/contact" className="text-white/85 hover:text-white">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main row: logo + search + account */}
      <div className="bg-gradient-to-b from-[#16a3cc] to-[#0b5f86] text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="getownerinfo home">
            <span className="flex h-11 w-[132px] items-center justify-center overflow-hidden">
              <img src="/brand/logo-getownerinfo-transparent.png" alt="" className="h-10 w-auto object-contain drop-shadow-sm" />
            </span>
          </Link>

          <HeaderSearch />

          <div className="flex items-center gap-3 sm:gap-5">
            {/* mobile contact icons */}
            <a href="tel:+250788385831" aria-label="Call support" className="text-white sm:hidden"><Phone className="h-5 w-5" /></a>
            <a href="https://wa.me/250788385831" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white sm:hidden"><MessageCircle className="h-5 w-5" /></a>

            {session ? (
              <Link href={dashboardPath} className="hidden items-center gap-1.5 text-sm font-bold text-white hover:text-[#9fdcef] sm:flex">
                <CircleUser className="h-6 w-6" />
                <span className="leading-tight text-left">My<br />Account</span>
                <ChevronDown className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/login" className="hidden items-center gap-1.5 text-sm font-bold text-white hover:text-[#9fdcef] sm:flex">
                <CircleUser className="h-6 w-6" />
                <span className="leading-tight text-left">Sign in<br />My Account</span>
                <ChevronDown className="h-4 w-4" />
              </Link>
            )}
            <Link href="/dashboard/buyer" aria-label="Saved listings" className="hidden text-white hover:text-[#9fdcef] sm:block">
              <Heart className="h-6 w-6" />
            </Link>
            <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} />
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <CategoryBar />
    </header>
  );
}
