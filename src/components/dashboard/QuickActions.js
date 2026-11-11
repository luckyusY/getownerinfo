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

// "r, g, b" for the --tile variable that colours each key (see .tile-key).
const TONES = {
  brand: "22, 104, 227",
  violet: "124, 58, 237",
  amber: "217, 119, 6",
  emerald: "5, 150, 105",
  sky: "17, 135, 176",
};

export default function QuickActions({ unreadMessages = 0 }) {
  const badges = { unreadMessages };

  return (
    <section className="card !p-5">
      <h2 className="font-display text-xl font-bold text-ink">Quick Actions</h2>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
        {ACTIONS.map(({ label, href, icon: Icon, tone, badge }) => {
          const count = badge ? badges[badge] : 0;
          return (
            <Link
              key={label}
              href={href}
              className="group flex flex-col items-center gap-2.5 rounded-2xl p-2 text-center transition hover:bg-paper active:scale-95"
            >
              <span
                className="tile-key relative !h-14 !w-14 !rounded-2xl transition duration-200 group-hover:-translate-y-1 group-active:translate-y-0.5"
                style={{ "--tile": TONES[tone] }}
              >
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
