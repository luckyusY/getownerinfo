import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DASHBOARD_PATHS } from "@/lib/dashboardPath";
import PublicNav from "@/components/public/PublicNav";
import RegionPicker from "@/components/public/RegionPicker";
import MobileMenu from "@/components/MobileMenu";
import MobileSearch from "@/components/MobileSearch";
import AccountDropdown from "@/components/AccountDropdown";
import NotificationBell from "@/components/NotificationBell";
import GoogleOneTap from "@/components/GoogleOneTap";

export default function SiteHeader() {
  const session = getSession();
  const dashboardPath = session ? DASHBOARD_PATHS[session.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      {!session && <GoogleOneTap />}

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:px-4 lg:gap-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Get Owner Info home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-getownerinfo-cropped-white.png"
            alt="Get Owner Info"
            className="h-10 w-auto object-contain sm:h-12"
          />
        </Link>

        <PublicNav />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <RegionPicker />

          {session ? (
            <>
              <NotificationBell />
              <AccountDropdown session={session} dashboardPath={dashboardPath || "/dashboard"} />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="btn-outline !rounded-lg">Sign In</Link>
              <Link href="/register" className="btn-primary !rounded-lg">Create Account</Link>
            </div>
          )}

          <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} session={session} />
        </div>
      </div>

      <div className="border-t border-line px-3 py-2 lg:hidden">
        <MobileSearch />
      </div>
    </header>
  );
}
