import Link from "next/link";

const COLS = [
  {
    title: "Get to know us",
    links: [
      ["About", "/about"],
      ["FAQ", "/faq"],
      ["How it works", "/#how"],
      ["Contact us", "/contact"],
    ],
  },
  {
    title: "Use the platform",
    links: [
      ["Browse listings", "/listings"],
      ["Seeker requests", "/seekers"],
      ["List your property", "/dashboard/owner/listings/new"],
      ["My account", "/dashboard"],
    ],
  },
];

const SOCIALS = [
  ["Facebook", "Fb"],
  ["Instagram", "Ig"],
  ["Twitter", "X"],
  ["YouTube", "Yt"],
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-ink text-white/80">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">g</span>
              <span className="font-display text-xl font-semibold text-white">getowner<span className="text-brand-light">info</span></span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Connecting serious buyers and tenants directly with verified owners across Rwanda, with privacy and trust built in.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map(([label, glyph]) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-xs font-bold transition hover:bg-brand hover:text-white"
                >
                  {glyph}
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-white/60 transition hover:text-brand-light">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-white">Newsletter</h4>
            <p className="mt-4 text-sm text-white/60">Get new verified listings in your inbox.</p>
            <form className="mt-3 flex gap-2" action="#">
              <input
                type="email"
                placeholder="Your email"
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand"
              />
              <button type="submit" className="btn-primary shrink-0 px-4">Join</button>
            </form>
            <p className="mt-5 text-xs text-white/50">+250 788 385 831</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row">
          <p>{new Date().getFullYear()} getownerinfo. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/cookies" className="hover:text-white">Cookie preferences</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
