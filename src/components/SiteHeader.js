import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import MobileMenu from "@/components/MobileMenu";

const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.MANAGER]: "/dashboard/manager",
  [ROLES.OWNER]: "/dashboard/owner",
  [ROLES.BUYER]: "/dashboard/buyer",
};

const NAV = [
  ["Home", "/"],
  ["Browse", "/listings"],
  ["Requests", "/seekers"],
  ["How it works", "/#how"],
  ["Contact", "/contact"],
];

export default function SiteHeader() {
  const session = getSession();
  const dashboardPath = session ? DASHBOARD_PATHS[session.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
      {/* Slim contact bar */}
      <div className="hidden border-b border-line/70 bg-ink text-white/80 sm:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs">
          <span>📞 +250 788 385 831 · Verified owners across Rwanda</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/faq" className="hover:text-white">FAQ</Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-base font-bold text-white shadow-soft">g</span>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            getowner<span className="text-brand">info</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(([label, href]) => (
            <Link key={label} href={href} className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:bg-panel hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {session ? (
              <Link href={dashboardPath} className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">Log in</Link>
                <Link href="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </div>
          <MobileMenu loggedIn={!!session} dashboardPath={dashboardPath || "/dashboard"} />
        </div>
      </div>
    </header>
  );
}
