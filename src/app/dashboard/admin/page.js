import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import Listing from "@/models/Listing";
import User from "@/models/User";
import Report from "@/models/Report";
import { guardRole } from "@/lib/guardRole";
import { ROLES, LISTING_STATUS } from "@/lib/constants";
import { PageHeader, StatCard } from "@/components/ui/Dashboard";
import { ADMIN_SECTIONS, adminHref } from "@/lib/adminSections";

export const metadata = { title: "Overview · Admin" };

/**
 * Admin landing page.
 *
 * This used to render all nine admin panels stacked on one route, navigated by
 * an in-page chip bar. Each panel is a client component that fetches its own
 * data, so opening the console fired nine sets of requests before an admin had
 * chosen what to work on. The panels now live at /dashboard/admin/<section>,
 * and this page is the triage view: what is waiting, and a way into each one.
 */
export default async function AdminDashboard() {
  guardRole(ROLES.ADMIN);
  await connectDB();

  const [pending, active, users, pendingKyc, openReports] = await Promise.all([
    Listing.countDocuments({ status: LISTING_STATUS.PENDING_APPROVAL }),
    Listing.countDocuments({ status: LISTING_STATUS.ACTIVE }),
    User.countDocuments({}),
    User.countDocuments({ "kyc.status": "pending" }),
    Report.countDocuments({ status: "open" }),
  ]);

  const counts = { pending, pendingKyc, openReports };
  const waiting = pending + pendingKyc + openReports;

  return (
    <div>
      <PageHeader
        title="Admin overview"
        subtitle={
          waiting
            ? `${waiting} ${waiting === 1 ? "item needs" : "items need"} a decision.`
            : "Nothing is waiting for a decision right now."
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending approvals" value={pending} tone={pending ? "brand" : "default"} />
        <StatCard label="Awaiting verification" value={pendingKyc} tone={pendingKyc ? "brand" : "default"} />
        <StatCard label="Open reports" value={openReports} tone={openReports ? "brand" : "default"} />
        <StatCard label="Active listings" value={active} />
        <StatCard label="Registered users" value={users} />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-bold text-ink">Console</h2>
        <p className="mt-1 text-sm text-ink-soft">Each section loads on its own, so only the work you open is fetched.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ADMIN_SECTIONS.map(({ slug, label, description, icon: Icon, countKey }) => {
            const count = countKey ? counts[countKey] : 0;
            return (
              <Link
                key={slug}
                href={adminHref(slug)}
                className="group flex min-w-0 items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-light hover:shadow-lift"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-ink">{label}</span>
                    {count > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-black text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold leading-relaxed text-ink-soft">
                    {description}
                  </span>
                </span>

                <ArrowRight className="h-4 w-4 shrink-0 self-center text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
