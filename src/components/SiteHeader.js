import Link from "next/link";
import { ChevronDown, CircleUser, Heart, LayoutDashboard, LogIn, MessageCircle, Phone, PlusCircle, ShieldCheck, UserPlus } from "lucide-react";
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
      <div className="bg-[#071c1f] px-3 py-1 text-center text-[11px] font-bold leading-[18px] text-white">
        <span className="text-[#9fdcef]">Verified owners across Rwanda</span> - unlock direct contact in seconds.{" "}
        <Link href="/#how" className="text-[#9fdcef] underline-offset-2 hover:underline">HOW IT WORKS</Link>
      </div>

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

      <div className="bg-gradient-to-b from-[#16a3cc] to-[#0b5f86] text-white">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center" aria-label="getownerinfo home">
            <span className="flex h-12 w-[146px] items-center justify-center overflow-hidden rounded-full bg-white px-3 shadow-[0_10px_24px_rgba(3,18,30,0.16)] ring-1 ring-white/70 sm:h-14 sm:w-[166px] sm:px-4">
              <img src="/brand/logo-getownerinfo-cropped-white.png" alt="" className="h-10 w-auto object-contain sm:h-12" />
            </span>
          </Link>

          <HeaderSearch />

          <div className="flex items-center gap-3 sm:gap-5">
            <a href="tel:+250788385831" aria-label="Call support" className="text-white sm:hidden"><Phone className="h-5 w-5" /></a>
            <a href="https://wa.me/250788385831" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-white sm:hidden"><MessageCircle className="h-5 w-5" /></a>

            {session ? (
              <div className="group relative hidden sm:block">
                <Link href={dashboardPath} className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#9fdcef]">
                  <CircleUser className="h-6 w-6" />
                  <span className="text-left leading-tight">My<br />Account</span>
                  <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" />
                </Link>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-3 w-64 translate-y-2 overflow-hidden rounded-xl border border-white/20 bg-white text-ink opacity-0 shadow-lift ring-1 ring-black/5 transition group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="border-b border-line bg-brand-50 px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-brand-dark">Signed in</p>
                    <p className="mt-0.5 text-sm font-bold capitalize text-ink">{session.role} account</p>
                  </div>
                  <Link href={dashboardPath} className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <LayoutDashboard className="h-4 w-4 text-brand" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/buyer" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <Heart className="h-4 w-4 text-brand" />
                    Saved listings
                  </Link>
                  <Link href="/contact" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <MessageCircle className="h-4 w-4 text-brand" />
                    Support
                  </Link>
                </div>
              </div>
            ) : (
              <div className="group relative hidden sm:block">
                <Link href="/login" className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-[#9fdcef]">
                  <CircleUser className="h-6 w-6" />
                  <span className="text-left leading-tight">Sign in<br />My Account</span>
                  <ChevronDown className="h-4 w-4 transition group-hover:rotate-180" />
                </Link>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-3 w-72 translate-y-2 overflow-hidden rounded-xl border border-white/20 bg-white text-ink opacity-0 shadow-lift ring-1 ring-black/5 transition group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="border-b border-line bg-gradient-to-r from-brand-50 to-white px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-wide text-brand-dark">Verified access</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink-soft">Sign in faster with Google or email.</p>
                  </div>
                  <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <LogIn className="h-4 w-4 text-brand" />
                    Sign in
                  </Link>
                  <Link href="/register" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <UserPlus className="h-4 w-4 text-brand" />
                    Create buyer account
                  </Link>
                  <Link href="/register?role=owner" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <PlusCircle className="h-4 w-4 text-brand" />
                    List as owner
                  </Link>
                  <Link href="/#how" className="flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-brand-50">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    How verification works
                  </Link>
                </div>
              </div>
            )}

            <Link href="/dashboard/buyer" aria-label="Saved listings" className="hidden text-white hover:text-[#9fdcef] sm:block">
              <Heart className="h-6 w-6" />
            </Link>
            <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} />
          </div>
        </div>
      </div>

      <CategoryBar />
    </header>
  );
}
