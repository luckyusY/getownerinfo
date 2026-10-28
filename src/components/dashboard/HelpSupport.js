import Link from "next/link";
import { FileText, Headphones, HelpCircle, MessageCircle } from "lucide-react";

const ITEMS = [
  {
    href: "/contact",
    icon: MessageCircle,
    title: "Live Chat",
    hint: "Online",
    tone: "bg-brand-50 text-brand",
    online: true,
  },
  { href: "/faq", icon: HelpCircle, title: "Help Center", hint: "FAQs", tone: "bg-violet-50 text-violet-600" },
  { href: "/contact", icon: Headphones, title: "Contact Us", hint: "Get in touch", tone: "bg-emerald-50 text-emerald-600" },
  { href: "/terms", icon: FileText, title: "Terms & Policies", hint: "Privacy, Terms", tone: "bg-sky-50 text-sky-dark" },
];

export default function HelpSupport() {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <h2 className="font-display text-lg font-bold text-ink">Help &amp; Support</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {ITEMS.map(({ href, icon: Icon, title, hint, tone, online }) => (
          <Link
            key={title}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-line bg-paper p-3 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-ink">{title}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-faint">
              {online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              {hint}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
