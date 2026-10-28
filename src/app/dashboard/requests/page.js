import Link from "next/link";
import { connectDB } from "@/lib/db";
import SeekerRequest from "@/models/SeekerRequest";
import Category from "@/models/Category";
import { guardRole } from "@/lib/guardRole";
import { ALL_ROLES } from "@/lib/constants";
import { formatRwf, formatDate } from "@/lib/format";
import { PageHeader, SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

const GROUPS = [
  { key: "active", title: "Active requests", hint: "Visible to owners right now." },
  { key: "fulfilled", title: "Fulfilled", hint: "You found what you were looking for." },
  { key: "expired", title: "Expired", hint: "Past their validity window." },
];

export default async function MyRequestsPage() {
  const session = guardRole(ALL_ROLES);
  await connectDB();

  const [requests, categories] = await Promise.all([
    SeekerRequest.find({ seeker: session.sub }).sort({ createdAt: -1 }).lean(),
    Category.find({}).select("name").lean(),
  ]);
  const catName = Object.fromEntries(categories.map((c) => [c._id.toString(), c.name]));

  const byStatus = (key) =>
    requests.filter((r) => (key === "expired" ? ["expired", "closed"].includes(r.status) : r.status === key));

  return (
    <div>
      <PageHeader
        title="My requests"
        subtitle="What you have asked owners to bring to you. Your contact stays hidden until someone pays the view token."
        actions={<Link href="/seekers/new" className="btn-primary">Post a request</Link>}
      />

      {requests.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No requests posted"
            hint="Tell owners exactly what you are looking for and let them come to you."
            action={<Link href="/seekers/new" className="btn-primary">Post a request</Link>}
          />
        </div>
      ) : (
        GROUPS.map((group) => {
          const rows = byStatus(group.key);
          if (!rows.length) return null;
          return (
            <section key={group.key} className="mt-8">
              <SectionHeading title={group.title} description={group.hint} />
              <div className="grid gap-3">
                {rows.map((r) => (
                  <Link
                    key={r._id.toString()}
                    href={`/seekers/${r._id.toString()}`}
                    className="card premium-hover !p-4 transition hover:border-brand/30"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-lg font-semibold text-ink">
                            {catName[r.category?.toString()] || "Request"}
                          </p>
                          <Badge tone={r.status === "active" ? "success" : "neutral"} dot>{r.status}</Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{r.details}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-ink-faint">
                          {r.preferredLocation && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-brand" /> {r.preferredLocation}
                            </span>
                          )}
                          {(r.budgetMin > 0 || r.budgetMax > 0) && (
                            <span>{formatRwf(r.budgetMin)} – {formatRwf(r.budgetMax)}</span>
                          )}
                          <span>Posted {formatDate(r.createdAt)}</span>
                          <span>Expires {formatDate(r.expiresAt)}</span>
                          <span>{r.unlockCount || 0} {r.unlockCount === 1 ? "response" : "responses"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
