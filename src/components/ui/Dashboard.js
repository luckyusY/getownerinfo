// Shared dashboard layout primitives, on the design tokens.

import { Children, cloneElement, isValidElement } from "react";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="dashboard-reveal rounded-xl border border-line bg-surface px-5 py-5 shadow-soft sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Dashboard</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
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
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }) {
  const accent = tone === "brand" ? "text-brand" : tone === "danger" ? "text-red-600" : "text-ink";
  const bar = tone === "brand" ? "bg-brand" : tone === "danger" ? "bg-red-500" : "bg-ink";
  return (
    <div className="card premium-hover dashboard-reveal relative overflow-hidden !p-5">
      <span className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
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
