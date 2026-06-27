import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import DashboardNav from "@/components/DashboardNav";

const ROLE_LABELS = {
  admin: "Administrator",
  platform_listing_manager: "Listing Manager",
  owner: "Owner",
  buyer: "Buyer / Tenant",
};

export default async function DashboardLayout({ children }) {
  const session = getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) redirect("/login");

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-11 w-[132px] items-center justify-center overflow-hidden">
              <img src="/brand/logo-getownerinfo-transparent.png" alt="Get Owner Info" className="h-10 w-auto object-contain" />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs text-ink-faint">{ROLE_LABELS[user.role]}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand">{initials}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
        <aside className="md:w-64 md:shrink-0">
          <div className="md:sticky md:top-20">
            <DashboardNav role={user.role} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
