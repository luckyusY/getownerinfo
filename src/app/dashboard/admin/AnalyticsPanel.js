"use client";

import { useEffect, useState } from "react";

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

  if (!data) return <p className="mt-6 text-sm text-ink-faint">Loading analytics…</p>;

  const byType = Object.entries(data.revenue.byType);
  const maxDay = Math.max(1, ...data.revenue.byDay.map((d) => d.total));

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-ink">Analytics</h2>

      {/* Revenue headline */}
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-ink-faint">Total revenue</p>
          <p className="mt-1 text-2xl font-bold text-ink">{money(data.revenue.total)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-faint">Last 30 days</p>
          <p className="mt-1 text-2xl font-bold text-ink">{money(data.revenue.last30Days)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-faint">Token unlocks (30d / total)</p>
          <p className="mt-1 text-2xl font-bold text-ink">{data.unlocks.last30Days} / {data.unlocks.total}</p>
        </div>
      </div>

      {/* Revenue by type */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="mb-3 text-sm font-medium text-ink">Revenue by type</p>
          {byType.length === 0 ? (
            <p className="text-sm text-ink-faint">No paid revenue yet.</p>
          ) : (
            <ul className="space-y-2">
              {byType.map(([type, v]) => {
                const pct = data.revenue.total ? Math.round((v.total / data.revenue.total) * 100) : 0;
                return (
                  <li key={type}>
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-soft">{TYPE_LABELS[type] || type}</span>
                      <span className="font-medium text-ink">{money(v.total)} · {v.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-panel">
                      <div className="h-2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Daily revenue trend */}
        <div className="card">
          <p className="mb-3 text-sm font-medium text-ink">Daily revenue (30d)</p>
          {data.revenue.byDay.length === 0 ? (
            <p className="text-sm text-ink-faint">No revenue in the last 30 days.</p>
          ) : (
            <div className="flex h-32 items-end gap-1">
              {data.revenue.byDay.map((d) => (
                <div key={d.date} className="flex-1 rounded-t bg-brand/70" title={`${d.date}: ${money(d.total)}`}
                  style={{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Breakdown chips */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Breakdown title="Listings by model" map={data.listings.byModel} render={(k) => `Model ${k}`} field="count" />
        <Breakdown title="Listings by status" map={data.listings.byStatus} field="count" />
        <Breakdown title="Users by role" map={data.users} field="count" />
      </div>
    </div>
  );
}

function Breakdown({ title, map, render = (k) => k, field }) {
  const rows = Object.entries(map || {});
  return (
    <div className="card">
      <p className="mb-2 text-sm font-medium text-ink">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-faint">—</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span className="capitalize text-ink-soft">{render(k).replace?.(/_/g, " ") || render(k)}</span>
              <span className="font-medium text-ink">{v[field]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
