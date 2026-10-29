import Link from "next/link";
import { ArrowRight, Car, ChevronRight, Home, Inbox, MapPin, Package } from "lucide-react";
import { formatDate } from "@/lib/format";
import Badge from "@/components/ui/Badge";

const CATEGORY_ICON = {
  "real-estate": Home,
  vehicles: Car,
  "vehicle-resellers": Car,
};

export default function MyRequests({ requests = [] }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">My Requests</h2>
        <Link href="/dashboard/requests" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 py-5 text-center">
          <Inbox className="h-7 w-7 text-ink-faint" />
          <p className="text-sm font-semibold text-ink-faint">
            Nothing posted yet. Tell owners what you are looking for.
          </p>
          <Link href="/seekers/new" className="btn-outline !min-h-9 !py-1.5 !text-xs">Post a request</Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {requests.map((r) => {
            const Icon = CATEGORY_ICON[r.categorySlug] || Package;
            return (
              <li key={r.id}>
                <Link href={`/seekers/${r.id}`} className="flex items-start gap-3 py-3 transition hover:bg-paper">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-ink">
                        {r.details?.slice(0, 48) || r.categoryName}
                        {r.details?.length > 48 ? "…" : ""}
                      </span>
                      <Badge tone={r.status === "active" ? "success" : "neutral"} dot>
                        {r.status}
                      </Badge>
                    </span>
                    {r.location && (
                      <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink-faint">
                        <MapPin className="h-3.5 w-3.5 text-brand" /> {r.location}
                      </span>
                    )}
                    <span className="mt-1 flex flex-wrap gap-x-3 text-[11px] font-bold text-ink-faint">
                      <span>Posted {formatDate(r.createdAt)}</span>
                      <span>{r.responses} {r.responses === 1 ? "response" : "responses"}</span>
                    </span>
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 self-center text-ink-faint" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
