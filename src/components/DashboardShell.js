export default function DashboardShell({ title, subtitle, cards }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{c.value}</p>
            {c.hint && <p className="mt-1 text-xs text-slate-400">{c.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 card">
        <p className="text-sm text-slate-500">
          More features arrive as we build the remaining phases (listings, token
          unlocks, commissions, chat, penalties, analytics).
        </p>
      </div>
    </div>
  );
}
