"use client";

import { X } from "lucide-react";

export const DEAL_OPTIONS = [
  { value: "all", label: "All" },
  { value: "rent", label: "Rent" },
  { value: "sale", label: "Buy" },
];

export const TRUST_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "A", label: "Exclusive" },
  { value: "B", label: "Standard" },
];

export const SORT_OPTIONS = [
  { value: "new", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

/**
 * One row of filter chips. Shared so the desktop bar and the mobile sheet
 * cannot drift apart — they differ only in whether the row scrolls sideways
 * (desktop, where space is tight beside everything else) or wraps (the sheet,
 * where there is room and sideways scrolling hides options).
 */
export function ChipRow({ icon: Icon, label, options, value, onChange, scroll = false }) {
  return (
    <div className={scroll ? "min-w-0" : ""}>
      {label && (
        <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
          {Icon && <Icon className="h-3.5 w-3.5" />} {label}
        </p>
      )}
      <div className={scroll ? "flex gap-2 overflow-x-auto pb-1" : "flex flex-wrap gap-1.5"}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="chip shrink-0"
            data-active={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PriceRange({ min, max, onMin, onMax }) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="numeric"
        placeholder="Min Rwf"
        value={min}
        onChange={(e) => onMin(e.target.value)}
        aria-label="Minimum price"
        className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand sm:w-24"
      />
      <span className="shrink-0 text-ink-faint">-</span>
      <input
        type="number"
        inputMode="numeric"
        placeholder="Max Rwf"
        value={max}
        onChange={(e) => onMax(e.target.value)}
        aria-label="Maximum price"
        className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand sm:w-24"
      />
    </div>
  );
}

export function SortSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sort listings"
      className={`min-h-11 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand ${className}`}
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/**
 * Mobile filter sheet: slides up from the bottom, the pattern a phone user
 * expects, instead of stacking four rows of controls permanently under the
 * header and leaving barely any room for the listings themselves.
 *
 * Results update live behind the sheet, so the footer button reports the
 * current count rather than pretending to apply anything.
 */
export function FilterSheet({ open, onClose, onReset, activeCount, resultCount, children }) {
  if (!open) return null;

  return (
    // Above the cookie banner (z-50): this is a modal the user just opened, and
    // the banner would otherwise paint across the middle of it.
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-line bg-surface shadow-lift">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Filters{activeCount ? ` (${activeCount})` : ""}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              disabled={!activeCount}
              className="text-sm font-bold text-brand disabled:text-ink-faint"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="grid gap-5">{children}</div>
        </div>

        <div
          className="border-t border-line px-4 py-3"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button type="button" onClick={onClose} className="btn-primary w-full">
            Show {resultCount} {resultCount === 1 ? "listing" : "listings"}
          </button>
        </div>
      </div>
    </div>
  );
}
