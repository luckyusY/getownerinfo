// Shared dashboard layout primitives, on the design tokens.

import { Children, cloneElement, isValidElement } from "react";
import {
  AlertTriangle, BadgeCheck, Banknote, BarChart3, Clock, FileText, Handshake,
  Heart, Home, KeyRound, Receipt, Users,
} from "lucide-react";

/**
 * Page masthead.
 *
 * A navy band with the survey grid, the same dark material as the footer and
 * the sign-in stage. A dashboard page is otherwise white cards on a pale
 * canvas; this is what gives it a top, and it makes the page's one primary
 * action (passed as `actions`) the brightest thing on the screen.
 *
 * `eyebrow` names the area the page belongs to ("Payments", "Administration").
 */
export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="dash-hero dashboard-reveal">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className="font-display text-[1.75rem] font-extrabold sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-[15px]">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// What a stat is about decides its icon and colour, so call sites keep passing
// just a label and a value. Colours are "r, g, b" for the --tile variable.
const TILE = {
  blue: "22, 104, 227",
  sky: "17, 135, 176",
  green: "5, 150, 105",
  amber: "217, 119, 6",
  violet: "124, 58, 237",
  red: "220, 38, 38",
};
const TILE_RULES = [
  [/penalt|outstanding|overdue|due\b|report/i, AlertTriangle, "red"],
  [/pending|awaiting|approval|review/i, Clock, "amber"],
  [/paid|spent|fee|vat|commission|revenue|total paid/i, Banknote, "green"],
  [/unlock|contact|token/i, KeyRound, "sky"],
  [/saved|favou?rite/i, Heart, "violet"],
  [/request/i, FileText, "violet"],
  [/user|owner|assigned/i, Users, "violet"],
  [/negotiat/i, Handshake, "sky"],
  [/transaction/i, Receipt, "sky"],
  [/active/i, BadgeCheck, "green"],
  [/listing/i, Home, "blue"],
];
function tileFor(label, tone) {
  const hit = TILE_RULES.find(([re]) => re.test(String(label)));
  const Icon = hit?.[1] || BarChart3;
  // An explicit tone outranks the keyword: "danger" is always red, and a
  // "default" zero ("0 penalties outstanding") should not be dressed as an alarm.
  const color = tone === "danger" ? "red" : hit?.[2] === "red" ? "blue" : hit?.[2] || "blue";
  return { Icon, color: TILE[color] };
}

/**
 * A single figure with its label.
 *
 * Each tile has its own colour and icon, picked from what the figure is about,
 * so a row of them reads as distinct instruments rather than identical boxes.
 * The figure is set large in the display face with tabular digits; it is the
 * only thing on the tile meant to be read from across the room.
 */
export function StatCard({ label, value, hint, tone = "default" }) {
  const { Icon, color } = tileFor(label, tone);
  const figure = tone === "danger" ? "text-red-600" : "text-ink";
  return (
    <div className="stat-tile dashboard-reveal" style={{ "--tile": color }}>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-1 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
        <span className="tile-key" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`stat-figure mt-3 text-[2rem] font-extrabold leading-none ${figure}`}>{value}</p>
      {hint && <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">{hint}</p>}
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
          <thead className="border-b border-line bg-panel/80 text-left font-display text-[10px] uppercase tracking-[0.14em] text-ink-faint">
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
