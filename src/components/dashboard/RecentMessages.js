import Link from "next/link";
import { ArrowRight, ChevronRight, MessageSquareText } from "lucide-react";

/** Short, human relative time: "2 mins ago", "3 hours ago", "1 day ago". */
function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const units = [
    ["min", 60],
    ["hour", 60],
    ["day", 24],
    ["month", 30],
  ];
  let value = Math.floor(seconds / 60);
  let label = "min";
  for (let i = 1; i < units.length; i += 1) {
    const [nextLabel, divisor] = units[i];
    if (value < divisor) break;
    value = Math.floor(value / divisor);
    label = nextLabel;
  }
  return `${value} ${label}${value === 1 ? "" : "s"} ago`;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function RecentMessages({ conversations = [] }) {
  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Recent Messages</h2>
        <Link href="/dashboard/messages" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {conversations.length === 0 ? (
        <p className="mt-6 flex flex-col items-center gap-2 py-6 text-center text-sm font-semibold text-ink-faint">
          <MessageSquareText className="h-7 w-7" />
          No conversations yet.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/listings/${c.listingId}`}
                className="flex items-start gap-3 py-3 transition hover:bg-paper"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 text-xs font-black text-brand">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(c.name)
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{c.name}</span>
                    <span className="rounded-full bg-panel px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-ink-soft">
                      {c.role}
                    </span>
                    <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-ink-faint">
                      {timeAgo(c.at)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-ink-soft">
                    {c.preview || c.listingTitle}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1.5 self-center">
                  {c.unread > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-black text-white">
                      {c.unread > 9 ? "9+" : c.unread}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-ink-faint" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
