import Link from "next/link";
import { ArrowRight, BadgeCheck, Coins, Eye, Home, Unlock } from "lucide-react";

const TILES = [
  { key: "listings", label: "Total Listings", icon: Home, tone: "bg-brand-50 text-brand" },
  { key: "active", label: "Active", icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
  { key: "views", label: "Total Views", icon: Eye, tone: "bg-violet-50 text-violet-600" },
  { key: "unlocks", label: "Contact Unlocks", icon: Unlock, tone: "bg-amber-50 text-amber-600" },
];

function compact(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n ?? 0);
}

export default function AccountOverview({ stats = {}, myUnlocks = 0 }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Account Overview</h2>
        <Link href="/dashboard/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-brand hover:text-brand-dark">
          View Details <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
        {TILES.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-xl border border-line bg-paper p-3">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{compact(stats[key])}</p>
            <p className="text-[11px] font-bold text-ink-faint">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
            <Coins className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-ink-soft">Contacts unlocked</p>
            <p className="font-display text-2xl font-bold leading-tight text-ink">
              {myUnlocks} {myUnlocks === 1 ? "contact" : "contacts"}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] font-semibold leading-5 text-ink-faint">
          Each unlock reveals one owner&apos;s contact and exact location.
        </p>
        <Link href="/listings" className="btn-primary mt-3 w-full !py-1.5 !text-xs">
          Unlock more <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
