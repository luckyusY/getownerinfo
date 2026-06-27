"use client";

import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/Dashboard";

function money(n) {
  return new Intl.NumberFormat("en-RW").format(n || 0) + " Rwf";
}

const TYPE_LABELS = {
  token_fee: "Token fees",
  listing_fee: "Listing fees",
  commission: "Commissions",
  penalty: "Penalties",
  seeker_post: "Seeker posts",
  seeker_view: "Seeker views",
};

export default function AnalyticsPanel() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then((j) => setData(j.data));
  }, []);

  if (!data) return <p className="mt-6 text-sm font-semibold text-ink-faint">Loading analytics...</p>;

  const byType = Object.entries(data.revenue.byType);
  const maxDay = Math.max(1, ...data.revenue.byDay.map((d) => d.total));

  return (
    <section className="mt-10">
      <SectionHeading title="Analytics" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total revenue" value={money(data.revenue.total)} />
        <Metric label="Last 30 days" value={money(data.revenue.last30Days)} />
        <Metric label="Token unlocks" value={`${data.unlocks.last30Days} / ${data.unlocks.total}`} hint="30d / total" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="mb-3 font-display text-base font-semibold text-ink">Revenue by type</p>
          {byType.length === 0 ? (
            <p className="text-sm text-ink-faint">No paid revenue yet.</p>
          ) : (
            <ul className="space-y-3">
              {byType.map(([type, v]) => {
                const pct = data.revenue.total ? Math.round((v.total / data.revenue.total) * 100) : 0;
                return (
                  <li key={type}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-ink-soft">{TYPE_LABELS[type] || type}</span>
                      <span className="font-bold text-ink">{money(v.total)} - {v.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <p className="mb-3 font-display text-base font-semibold text-ink">Daily revenue, 30 days</p>
          {data.revenue.byDay.length === 0 ? (
            <p className="text-sm text-ink-faint">No revenue in the last 30 days.</p>
          ) : (
            <div className="flex h-36 items-end gap-1.5 rounded-lg bg-panel/50 p-3">
              {data.revenue.byDay.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-brand/75"
                  title={`${d.date}: ${money(d.total)}`}
                  style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Breakdown title="Listings by model" map={data.listings.byModel} render={(k) => `Model ${k}`} field="count" />
        <Breakdown title="Listings by status" map={data.listings.byStatus} field="count" />
        <Breakdown title="Users by role" map={data.users} field="count" />
      </div>
    </section>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="card !p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

function Breakdown({ title, map, render = (k) => k, field }) {
  const rows = Object.entries(map || {});
  return (
    <div className="card">
      <p className="mb-3 font-display text-base font-semibold text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint">No data</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className="capitalize text-ink-soft">{render(k).replace?.(/_/g, " ") || render(k)}</span>
              <span className="font-bold text-ink">{v[field]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
