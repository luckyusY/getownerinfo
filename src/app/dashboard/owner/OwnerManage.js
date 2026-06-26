"use client";

import { useEffect, useState } from "react";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  under_negotiation: "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  sold: "bg-blue-100 text-blue-700",
  rented: "bg-blue-100 text-blue-700",
  not_concluded: "bg-slate-100 text-slate-500",
  expired: "bg-slate-100 text-slate-500",
};

const REPORTABLE = ["active", "under_negotiation"];

export default function OwnerManage() {
  const [listings, setListings] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportFor, setReportFor] = useState(null); // listing id
  const [outcome, setOutcome] = useState("sold");
  const [finalAmount, setFinalAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const [l, c, p] = await Promise.all([
      fetch("/api/listings/mine").then((r) => r.json()),
      fetch("/api/commissions/mine").then((r) => r.json()),
      fetch("/api/penalties/mine").then((r) => r.json()),
    ]);
    setListings(l.data?.listings || []);
    setCommissions(c.data?.commissions || []);
    setPenalties(p.data?.penalties || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submitOutcome(id) {
    setBusy(true);
    setError("");
    try {
      const body = { outcome };
      if (outcome !== "not_concluded") body.finalAmount = Number(finalAmount);
      const res = await fetch(`/api/listings/${id}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setReportFor(null);
      setFinalAmount("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function payCommission(id) {
    await payEndpoint(`/api/commissions/${id}/pay`);
  }
  async function payPenalty(id) {
    await payEndpoint(`/api/penalties/${id}/pay`);
  }
  async function payEndpoint(url) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="mt-6 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mt-8 space-y-8">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {/* Penalties */}
      {penalties.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Penalties</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Offense</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {penalties.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 capitalize text-slate-700">{p.offenseType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-slate-500">{p.reason}</td>
                    <td className="px-4 py-3 font-semibold">{money(p.total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${p.status === "active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{p.status}</span></td>
                    <td className="px-4 py-3">{p.status === "active" && <button className="btn-primary" disabled={busy} onClick={() => payPenalty(p.id)}>Pay</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Commissions */}
      {commissions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Commissions (Model A)</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Listing</th><th className="px-4 py-3">Deal</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.listingTitle}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{c.dealOutcome} · {money(c.finalAmount)}</td>
                    <td className="px-4 py-3 font-semibold">{money(c.total)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${c.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.status}</span></td>
                    <td className="px-4 py-3">
                      {c.status !== "paid" && (
                        <button className="btn-primary" disabled={busy} onClick={() => payCommission(c.id)}>Pay</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Listings */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900">Listings</h2>
        {listings.length === 0 ? (
          <div className="mt-3 card text-center text-sm text-slate-500">No listings yet.</div>
        ) : (
          <div className="mt-3 space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{l.title}</p>
                    <p className="text-xs text-slate-500">Model {l.model} · {money(l.price)} · {l.transactionType} · unlocks: {l.unlockCount ?? 0}</p>
                    {l.reviewFlag && <p className="mt-1 text-xs text-red-600">⚑ Flagged: {l.reviewReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${STATUS_STYLES[l.status] || "bg-slate-100"}`}>{l.status.replace(/_/g, " ")}</span>
                    {REPORTABLE.includes(l.status) && (
                      <button className="btn-outline" onClick={() => { setReportFor(reportFor === l.id ? null : l.id); setOutcome("sold"); setFinalAmount(""); }}>
                        Report deal
                      </button>
                    )}
                  </div>
                </div>

                {reportFor === l.id && (
                  <div className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
                    <div>
                      <label className="label">Outcome</label>
                      <select className="input" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                        <option value="not_concluded">Not concluded</option>
                      </select>
                    </div>
                    {outcome !== "not_concluded" && (
                      <div>
                        <label className="label">Final amount (Rwf)</label>
                        <input type="number" className="input" value={finalAmount} onChange={(e) => setFinalAmount(e.target.value)} />
                      </div>
                    )}
                    <div className="flex items-end">
                      <button className="btn-primary w-full" disabled={busy || (outcome !== "not_concluded" && !finalAmount)} onClick={() => submitOutcome(l.id)}>
                        {busy ? "Submitting…" : "Submit outcome"}
                      </button>
                    </div>
                    {l.model === "A" && outcome !== "not_concluded" && (
                      <p className="text-xs text-slate-500 sm:col-span-3">A commission invoice will be generated automatically for this Model A deal.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
