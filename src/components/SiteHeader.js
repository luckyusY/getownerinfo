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

      {/*
        One row at every width. The search used to sit on a second row below
        this one, which with the bottom tab bar put 184px of chrome on an 812px
        phone screen before a single piece of content appeared.
      */}
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:px-4 lg:gap-4 lg:py-2.5 xl:gap-6">
        <Link href="/" className="flex min-h-11 shrink-0 items-center" aria-label="Get Owner Info home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-getownerinfo-cropped-white.png"
            alt="Get Owner Info"
            className="h-9 w-auto object-contain lg:h-12"
          />
        </Link>

        <PublicNav />

        {/* Takes the width the nav leaves behind below lg. */}
        <div className="min-w-0 flex-1 lg:hidden">
          <MobileSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <RegionPicker />

          {session ? (
            <>
              <NotificationBell />
              <AccountDropdown session={session} dashboardPath={dashboardPath || "/dashboard"} />
            </>
          ) : (
            /* lg, not sm: below that these two would leave the inline search
               about sixty pixels. The drawer carries the same two actions. */
            <div className="hidden items-center gap-2 lg:flex">
              <Link href="/login" className="btn-outline !rounded-lg">Sign In</Link>
              <Link href="/register" className="btn-primary !rounded-lg">Create Account</Link>
            </div>
          )}

          <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} session={session} />
        </div>
      </div>
    </header>
  );
}
