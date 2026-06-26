"use client";

import { useEffect, useState } from "react";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

export default function ModerationQueue() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/listings?status=pending_approval");
    const j = await res.json();
    setListings(j.data?.listings || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function moderate(id, action) {
    const reason = action === "reject" ? prompt("Reason for rejection?") || "Rejected" : undefined;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/listings/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setListings((ls) => ls.filter((l) => l.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="mt-6 text-sm text-slate-500">Loading queue…</p>;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">Pending approvals ({listings.length})</h2>
      {error && <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {listings.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Nothing waiting for review.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{l.title}</p>
                  <p className="text-xs text-slate-500">
                    {l.ownerName} · {l.ownerEmail} · Model {l.model} · {money(l.price)} · {l.transactionType}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {l.itemType} · area: {l.location?.area || "—"} · proof: {(l.ownershipProof || []).length} file(s)
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-primary" disabled={busyId === l.id} onClick={() => moderate(l.id, "approve")}>Approve</button>
                  <button className="btn-outline" disabled={busyId === l.id} onClick={() => moderate(l.id, "reject")}>Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
