import Link from "next/link";
import { BadgeCheck, KeyRound, MessagesSquare, ShieldCheck } from "lucide-react";

const POINTS = [
  {
    icon: BadgeCheck,
    title: "Reviewed before it goes live",
    body: "Every listing is checked by our team, and owners verify their identity.",
  },
  {
    icon: KeyRound,
    title: "Straight to the owner",
    body: "A small token fee unlocks the owner's own contact and the exact location.",
  },
  {
    icon: MessagesSquare,
    title: "Ask before you pay",
    body: "Message about a listing first. Pay only when you are serious.",
  },
];

/**
 * Frame for the sign-in and sign-up pages.
 *
 * Both used to be a logo floating over a single centred card, which gave a
 * first-time visitor a form and no reason to fill it in. From lg up the left
 * pane now carries that reason; the right pane is the form and nothing else.
 * On a phone the pane is dropped rather than stacked, so the first field stays
 * on the first screen.
 */
export default function AuthShell({ title, lead, children, wide = false }) {
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        {/* The logo is a near-square mark with a small wordmark, so on navy it
            sits on its own white tile rather than being inverted to a blob. */}
        <Link
          href="/"
          aria-label="Get Owner Info home"
          className="inline-flex w-fit items-center rounded-2xl bg-white px-4 py-2 shadow-[inset_0_1px_0_#fff,0_3px_0_rgba(255,255,255,0.25),0_18px_30px_-16px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-getownerinfo-cropped-white.png"
            alt="Get Owner Info"
            className="h-14 w-auto object-contain"
          />
        </Link>

        <div className="my-10 max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-sky-light">
            <ShieldCheck className="h-3.5 w-3.5" /> Rwanda&apos;s owner-direct marketplace
          </p>
          <h2 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.1] !text-white xl:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75">{lead}</p>

          <ul className="mt-8 grid gap-3">
            {POINTS.map(({ icon: Icon, title: pointTitle, body }) => (
              <li key={pointTitle} className="auth-point">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sky-light ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{pointTitle}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/70">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs font-semibold text-white/50">
          © {new Date().getFullYear()} GetOwnerInfo · Kigali, Rwanda
        </p>
      </aside>

      <main className="auth-main">
        <div className={`mx-auto w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          {/* The brand pane is hidden below lg, so the logo moves here. */}
          <Link href="/" className="mb-6 inline-flex items-center lg:hidden" aria-label="Get Owner Info home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-getownerinfo-cropped-white.png"
              alt="Get Owner Info"
              className="h-11 w-auto object-contain"
            />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

/** "or" rule between the Google button and the email form. */
export function AuthDivider({ children = "or" }) {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/** Error banner at the head of a form. Announced to screen readers. */
export function AuthAlert({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-relaxed text-red-800"
    >
      <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
      <span>{children}</span>
    </div>
  );
}
