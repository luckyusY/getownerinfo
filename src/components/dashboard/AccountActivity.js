import ActivityChart from "./ActivityChart";

export default function AccountActivity({ series = [], labels = [] }) {
  const total = series.reduce((sum, s) => sum + s.points.reduce((a, b) => a + b, 0), 0);

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">Account Activity</h2>
        <span className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-bold text-ink-soft">
          Last 30 days
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-6 pb-4 text-center text-sm font-semibold text-ink-faint">
          No unlock activity in the last 30 days.
        </p>
      ) : (
        <div className="mt-3">
          <ActivityChart series={series} labels={labels} />
        </div>
      )}
    </section>
  );
}
