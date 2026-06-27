import Link from "next/link";
import { CircleUser, MessageCircle, Phone } from "lucide-react";
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
      <div className="bg-ink px-3 py-1 text-center text-[11px] font-bold leading-[18px] text-white">
        <span className="text-[#ffcf57]">Verified owners across Rwanda</span> — unlock direct contact in seconds.{" "}
        <Link href="/#how" className="text-[#ffcf57] underline-offset-2 hover:underline">HOW IT WORKS</Link>
      </div>

      {/* Utility bar */}
      <div className="hidden bg-[#0a4f6b] text-white sm:block">
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
      <div className="bg-[#0b5f86] text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="getownerinfo home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-base font-extrabold text-[#0b5f86]">g</span>
            <span className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              getowner<span className="text-[#ffcf57]">info</span>
            </span>
          </Link>

          <HeaderSearch />

          <div className="flex items-center gap-3">
            {/* mobile contact icons */}
            <a href="tel:+250788385831" aria-label="Call support" className="text-white sm:hidden"><Phone className="h-5 w-5" /></a>
            <a href="https://wa.me/250788385831" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white sm:hidden"><MessageCircle className="h-5 w-5" /></a>

            {session ? (
              <Link href={dashboardPath} className="hidden items-center gap-2 text-sm font-bold text-white hover:text-[#ffcf57] sm:flex">
                <CircleUser className="h-6 w-6" />
                <span className="leading-tight">My<br />Account</span>
              </Link>
            ) : (
              <Link href="/login" className="hidden items-center gap-2 text-sm font-bold text-white hover:text-[#ffcf57] sm:flex">
                <CircleUser className="h-6 w-6" />
                <span className="leading-tight">Sign in<br />My Account</span>
              </Link>
            )}
            <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} />
          </div>
        </div>
      </div>

      {/* Category nav bar */}
      <CategoryBar />
    </header>
  );
}
