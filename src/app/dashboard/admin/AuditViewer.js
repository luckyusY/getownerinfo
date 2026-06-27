"use client";

import { useEffect, useState } from "react";

export default function AuditViewer() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page) });
    if (action) qs.set("action", action);
    fetch(`/api/admin/audit?${qs}`).then((r) => r.json()).then((j) => setData(j.data));
  }, [page, action]);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Audit log</h2>
        <select className="input max-w-xs" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          {["listing.submit", "listing.approve", "listing.unlock", "listing.outcome", "payment.initiate",
            "commission.pay", "penalty.apply", "message.blocked", "seeker.create", "seeker.unlock"].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {!data ? (
        <p className="mt-3 text-sm text-ink-faint">Loading…</p>
      ) : data.entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink-faint">No audit entries.</p>
      ) : (
        <>
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-panel text-left text-xs uppercase text-ink-faint">
                <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Target</th></tr>
              </thead>
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.id} className="border-t border-line/70">
                    <td className="px-4 py-2 text-xs text-ink-faint">{new Date(e.at).toLocaleString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.action}</td>
                    <td className="px-4 py-2">{e.actorName} <span className="text-xs text-ink-faint">({e.actorRole})</span></td>
                    <td className="px-4 py-2 text-xs text-ink-faint">{e.targetType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-ink-faint">Page {data.page} of {data.totalPages} · {data.total} entries</span>
            <div className="flex gap-2">
              <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
