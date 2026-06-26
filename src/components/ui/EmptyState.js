export default function EmptyState({ icon = "✦", title, hint, action }) {
  return (
    <div className="card flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl text-brand">
        {icon}
      </div>
      <p className="font-display text-lg text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-soft">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
