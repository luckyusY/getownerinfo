"use client";

import { useEffect, useState } from "react";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

const OFFENSES = [
  "late_status_update",
  "under_reporting",
  "early_withdrawal",
  "false_not_concluded",
  "commission_delay",
  "token_bypass",
  "contact_sharing",
  "override_misuse",
];

export default function PenaltiesPanel() {
  const [penalties, setPenalties] = useState([]);
  const [summary, setSummary] = useState({ total: 0, outstanding: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ userEmail: "", offenseType: "under_reporting", reason: "", expectedAmount: "" });
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/penalties");
    const j = await res.json();
    setPenalties(j.data?.penalties || []);
    setSummary(j.data?.summary || { total: 0, outstanding: 0 });
  }
  useEffect(() => { load(); }, []);

  async function issue() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: form.userEmail,
          offenseType: form.offenseType,
          reason: form.reason,
          expectedAmount: Number(form.expectedAmount) || 0,
        }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setForm({ userEmail: "", offenseType: "under_reporting", reason: "", expectedAmount: "" });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function waive(id) {
    setBusy(true);
    try {
      await fetch(`/api/admin/penalties/${id}/waive`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Penalties — outstanding {money(summary.outstanding)}
        </h2>
        <button className="btn-outline" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Issue penalty"}
        </button>
      </div>

      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <div className="mt-3 grid gap-3 card sm:grid-cols-2">
          <div><label className="label">Offender email</label>
            <input className="input" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} /></div>
          <div><label className="label">Offense</label>
            <select className="input" value={form.offenseType} onChange={(e) => setForm({ ...form, offenseType: e.target.value })}>
              {OFFENSES.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select></div>
          <div><label className="label">Expected amount (Rwf, basis for 50%)</label>
            <input type="number" className="input" value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} /></div>
          <div><label className="label">Reason</label>
            <input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={busy || !form.userEmail || form.reason.length < 3} onClick={issue}>
              {busy ? "Issuing…" : "Issue penalty"}
            </button>
          </div>
        </div>
      )}

      {penalties.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No penalties issued.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Offense</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {penalties.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3"><div className="font-medium text-slate-900">{p.userName}</div><div className="text-xs text-slate-500">{p.userEmail}</div></td>
                  <td className="px-4 py-3 capitalize text-slate-600">{p.offenseType.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-semibold">{money(p.total)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${p.status === "active" ? "bg-red-100 text-red-700" : p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span></td>
                  <td className="px-4 py-3">{p.status === "active" && <button className="btn-outline" disabled={busy} onClick={() => waive(p.id)}>Waive</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
