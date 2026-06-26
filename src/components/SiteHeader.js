import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

const DASHBOARD_PATHS = {
  [ROLES.ADMIN]: "/dashboard/admin",
  [ROLES.MANAGER]: "/dashboard/manager",
  [ROLES.OWNER]: "/dashboard/owner",
  [ROLES.BUYER]: "/dashboard/buyer",
};

function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-soft">
        g
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        getowner<span className="text-brand">info</span>
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const session = getSession();
  const dashboardPath = session ? DASHBOARD_PATHS[session.role] : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Wordmark />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/listings" className="btn-ghost hidden sm:inline-flex">Browse</Link>
          <Link href="/seekers" className="btn-ghost hidden sm:inline-flex">Requests</Link>
          {session ? (
            <Link href={dashboardPath} className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
