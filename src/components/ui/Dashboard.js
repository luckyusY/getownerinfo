// Shared dashboard layout primitives, on the design tokens.

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

/** Table wrapper + header/cell helpers for consistent dashboard tables. */
export function Table({ head, children }) {
  return (
    <div className="dashboard-reveal overflow-hidden rounded-xl border border-line bg-surface shadow-soft">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="border-b border-line bg-panel/80 text-left text-[11px] uppercase tracking-wide text-ink-faint">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3.5 font-bold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line/70">{children}</tbody>
      </table>
      </div>
    </div>
  );
}

export function Tr({ children }) {
  return <tr className="transition hover:bg-brand-50/35">{children}</tr>;
}

export function Td({ children, className = "" }) {
  return <td className={`px-4 py-3.5 align-middle ${className}`}>{children}</td>;
}
