import Link from "next/link";
import {
  Coins, FilePlus2, Home, MessageSquareText, Search, ShieldCheck, UserCircle,
} from "lucide-react";

const ACTIONS = [
  { label: "New Listing", href: "/dashboard/owner/listings/new", icon: Home, tone: "brand" },
  { label: "Post a Request", href: "/seekers/new", icon: FilePlus2, tone: "violet" },
  { label: "Browse Listings", href: "/listings", icon: Search, tone: "brand" },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquareText, tone: "amber", badge: "unreadMessages" },
  { label: "My Tokens", href: "/dashboard/unlocks", icon: Coins, tone: "emerald" },
  { label: "My Profile", href: "/dashboard/profile", icon: UserCircle, tone: "brand" },
  { label: "Verification", href: "/dashboard/profile#verification", icon: ShieldCheck, tone: "sky" },
];

const TONES = {
  brand: "bg-brand-50 text-brand",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-dark",
};

export default function QuickActions({ unreadMessages = 0 }) {
  const badges = { unreadMessages };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <h2 className="font-display text-lg font-bold text-ink">Quick Actions</h2>

      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ACTIONS.map(({ label, href, icon: Icon, tone, badge }) => {
          const count = badge ? badges[badge] : 0;
          return (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-xl p-2 text-center transition hover:bg-paper"
            >
              <span className={`relative grid h-14 w-14 place-items-center rounded-2xl transition group-hover:-translate-y-0.5 ${TONES[tone]}`}>
                <Icon className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </span>
              <span className="text-xs font-bold leading-tight text-ink-soft group-hover:text-ink">{label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
