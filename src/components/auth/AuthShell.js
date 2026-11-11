import Link from "next/link";
import { BadgeCheck, KeyRound, MessagesSquare } from "lucide-react";

const POINTS = [
  [BadgeCheck, "Reviewed listings"],
  [KeyRound, "Straight to the owner"],
  [MessagesSquare, "Ask before you pay"],
];

/**
 * Frame for the sign-in and sign-up pages: one stage, one card.
 *
 * The page is Kigali at night under the brand navy, and the form floats on it
 * as a single lit sheet with the logo above and three short promises below.
 * Everything is on one centre line, so there is one thing to look at and it
 * is the form.
 *
 * `title` is the line of welcome set above the card.
 */
export default function AuthShell({ title, children, wide = false }) {
  return (
    <div className="auth-stage">
      <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
        <div className="mb-6 flex flex-col items-center text-center">
          <Link
            href="/"
            aria-label="Get Owner Info home"
            className="inline-flex items-center rounded-2xl bg-white px-4 py-2 shadow-[inset_0_1px_0_#fff,0_3px_0_rgba(255,255,255,0.25),0_18px_30px_-16px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-getownerinfo-cropped-white.png"
              alt="Get Owner Info"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>
          {title && (
            <p className="mt-4 max-w-sm font-display text-lg font-semibold leading-snug text-white/90 sm:text-xl">
              {title}
            </p>
          )}
        </div>

        <div className="auth-card">{children}</div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {POINTS.map(([Icon, label]) => (
            <li key={label} className="auth-chip">
              <Icon className="h-3.5 w-3.5 text-sky-light" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** "or" rule between the Google button and the email form. */
export function AuthDivider({ children = "or" }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint">
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
