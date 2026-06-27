// Shared dashboard layout primitives, on the design tokens.

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeading({ title, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, tone = "default" }) {
  const accent = tone === "brand" ? "text-brand" : tone === "danger" ? "text-red-600" : "text-ink";
  return (
    <div className="card !p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${accent}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

/** Table wrapper + header/cell helpers for consistent dashboard tables. */
export function Table({ head, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-panel text-left text-xs uppercase tracking-wide text-ink-faint">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }) {
  return <tr className="border-t border-line/70">{children}</tr>;
}

export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
