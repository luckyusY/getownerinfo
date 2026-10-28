import { Grid3x3, Lock, Users, Zap } from "lucide-react";

const ITEMS = [
  { icon: Users, title: "Verified Owners", body: "Real people, real listings", tone: "bg-brand-50 text-brand" },
  { icon: Grid3x3, title: "Wide Categories", body: "Properties, vehicles, electronics and more", tone: "bg-emerald-50 text-emerald-600" },
  { icon: Lock, title: "Secure Payments", body: "Small token payment to access contact details", tone: "bg-violet-50 text-violet-600" },
  { icon: Zap, title: "Fast & Easy", body: "Just click and meet the owner", tone: "bg-amber-50 text-amber-600" },
];

export default function TrustRow() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <ul className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
        {ITEMS.map(({ icon: Icon, title, body, tone }) => (
          <li key={title} className="flex items-center gap-3 lg:px-5 lg:first:pl-0 lg:last:pr-0">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <p className="text-sm font-bold text-ink">{title}</p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-ink-soft">{body}</p>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
