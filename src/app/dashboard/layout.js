import Link from "next/link";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import DashboardNav from "@/components/DashboardNav";
import StartSellingButton from "@/components/StartSellingButton";

const ROLE_LABELS = {
  admin: "Administrator",
  platform_listing_manager: "Listing Manager",
  owner: "Owner",
  buyer: "Buyer / Tenant",
};

const QUICK_ACTIONS = {
  admin: [
    ["Moderation", "/dashboard/admin"],
    ["Browse listings", "/listings"],
  ],
  platform_listing_manager: [
    ["Review listings", "/dashboard/manager"],
    ["Browse listings", "/listings"],
  ],
  owner: [
    ["New listing", "/dashboard/owner/listings/new"],
    ["Messages", "/dashboard/owner/messages"],
    ["Browse as buyer", "/listings"],
  ],
  buyer: [
    ["Browse listings", "/listings"],
    ["Post request", "/seekers/new"],
  ],
};

export default async function DashboardLayout({ children }) {
  const session = getSession();
  if (!session) redirect("/login");

  await connectDB();
  const user = await User.findById(session.sub);
  if (!user) redirect("/login");

  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const profileItems = [user.name, user.email, user.phone].filter(Boolean).length;
  const profilePercent = Math.round((profileItems / 3) * 100);

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-12 w-[150px] items-center justify-center overflow-hidden rounded-full bg-white px-3 shadow-sm ring-1 ring-line">
              <img src="/brand/logo-getownerinfo-cropped-white.png" alt="Get Owner Info" className="h-11 w-auto object-contain" />
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
          <div className="space-y-4 md:sticky md:top-20">
            <DashboardNav role={user.role} />
            <section className="rounded-xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-black uppercase tracking-wide text-brand">Account</p>
              <p className="mt-1 truncate text-sm font-bold text-ink">{user.name}</p>
              <p className="truncate text-xs font-semibold text-ink-faint">{user.email}</p>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  <span>Profile</span>
                  <span>{profilePercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-panel">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${profilePercent}%` }} />
                </div>
              </div>
            </section>
            <section className="rounded-xl border border-line bg-surface p-4 shadow-soft">
              <p className="text-xs font-black uppercase tracking-wide text-brand">Quick actions</p>
              <div className="mt-3 grid gap-2">
                {(QUICK_ACTIONS[user.role] || []).map(([label, href]) => (
                  <Link key={href} href={href} className="rounded-lg bg-panel px-3 py-2 text-sm font-bold text-ink-soft transition hover:bg-brand-50 hover:text-brand">
                    {label}
                  </Link>
                ))}
                {user.role === "buyer" && (
                  <StartSellingButton className="rounded-lg bg-brand px-3 py-2 text-left text-sm font-bold text-white transition hover:bg-brand-dark" compact>
                    Start selling
                  </StartSellingButton>
                )}
              </div>
            </section>
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
