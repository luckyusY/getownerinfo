import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          getowner<span className="text-slate-800">info</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/listings" className="text-sm text-slate-600 hover:text-slate-900">
            Browse
          </Link>
          <Link href="/seekers" className="text-sm text-slate-600 hover:text-slate-900">
            Requests
          </Link>
          {session ? (
            <Link href={dashboardPath} className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
