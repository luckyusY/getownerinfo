// Shared dashboard layout primitives, on the design tokens.

import { Children, cloneElement, isValidElement } from "react";

/**
 * Page masthead.
 *
 * `eyebrow` names the area the page belongs to ("Payments", "Administration").
 * It used to read "Dashboard" on every page, which told nobody anything they
 * could not see from the sidebar; without one the line is simply not drawn.
 * The brand rule down the left edge is what marks this as the head of the page
 * rather than one more card in the stack beneath it.
 */
export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="dashboard-reveal relative overflow-hidden rounded-2xl border border-line bg-surface px-5 py-5 shadow-soft sm:px-7 sm:py-6">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand to-sky" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h1 className="text-balance font-display text-2xl font-bold leading-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * A single figure with its label.
 *
 * Tone is carried by a dot beside the label and by the figure itself. The card
 * used to wear a full-width coloured bar and a hover glow: the bar made a row
 * of neutral stats look like four black-topped alerts, and the glow promised a
 * click on something that is not a link. A stat that needs attention ("brand",
 * "danger") now stands out because the quiet ones are actually quiet.
 */
export function StatCard({ label, value, hint, tone = "default" }) {
  const accent = tone === "brand" ? "text-brand" : tone === "danger" ? "text-red-600" : "text-ink";
  const dot = tone === "brand" ? "bg-brand" : tone === "danger" ? "bg-red-500" : "bg-line";
  const frame = tone === "danger" ? "!border-red-200" : "";
  return (
    <div className={`card dashboard-reveal !p-5 ${frame}`}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
        <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {label}
      </p>
      <p className={`stat-figure mt-2.5 font-display text-[1.75rem] font-bold leading-none ${accent}`}>{value}</p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-ink-faint">{hint}</p>}
    </div>
  );
}

const ALIGN = { right: "text-right", center: "text-center", left: "text-left" };

/**
 * Table wrapper + header/cell helpers for consistent dashboard tables.
 *
 * Rows are numbered by default: these tables are read down a column and
 * referred to out loud ("the third one owes the most"), and a running number
 * gives that something to point at. `startIndex` keeps the numbering true
 * across pages — page 2 of a 20-row table starts at 21, not 1.
 *
 * A `head` entry is either a string or `{ label, align, numeric, width }`.
 * `numeric` right-aligns the column and lines its digits up, which is what
 * makes a column of money comparable at a glance.
 */
export function Table({
  head,
  children,
  startIndex = 0,
  numbered = true,
  minWidth = 680,
}) {
  const columns = head.map((h) => (typeof h === "string" ? { label: h } : h));
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <div className="dashboard-reveal overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
      {/* overscroll-x-contain stops a swipe at the left edge turning into
          an iOS back-navigation out of the page. */}
      <div className="table-scroll overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead className="border-b border-line bg-panel/80 text-left text-[11px] uppercase tracking-wide text-ink-faint">
            <tr>
              {numbered && (
                <th scope="col" className="w-12 px-4 py-3.5 text-right font-bold" title="Row number">#</th>
              )}
              {columns.map(({ label, align, numeric, width }, i) => (
                <th
                  key={label || `col-${i}`}
                  scope="col"
                  className={`px-4 py-3.5 font-bold ${ALIGN[align] || (numeric ? "text-right" : "text-left")}`}
                  style={width ? { width } : undefined}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-line/70">
            {rows.map((row, i) =>
              cloneElement(row, { rowNumber: startIndex + i + 1, numbered })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Tr({ children, rowNumber, numbered = false }) {
  return (
    // Striping plus hover: the stripe helps the eye stay on one row across a
    // wide table, the hover says which row the pointer is on.
    <tr className="transition even:bg-paper/50 hover:bg-brand-50/35">
      {numbered && (
        <td className="px-4 py-3.5 text-right align-middle text-xs font-bold tabular-nums text-ink-faint">
          {rowNumber}
        </td>
      )}
      {children}
    </tr>
  );
}

export function Td({ children, className = "", numeric = false, align }) {
  return (
    <td
      className={`px-4 py-3.5 align-middle ${ALIGN[align] || (numeric ? "text-right" : "")} ${
        numeric ? "tabular-nums" : ""
      } ${className}`}
    >
      {children}
    </td>
  );
}
