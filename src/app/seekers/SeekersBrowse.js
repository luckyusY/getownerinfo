"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";

function money(n) {
  return n ? new Intl.NumberFormat("en-RW").format(n) + " Rwf" : "—";
}

export default function SeekersBrowse() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [revealed, setRevealed] = useState({}); // id -> contact
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/seekers").then((r) => r.json()),
      fetch("/api/catalog").then((r) => r.json()),
    ]).then(([s, c]) => {
      setRequests(s.data?.requests || []);
      setCatMap(Object.fromEntries((c.data?.categories || []).map((x) => [x.id, x.name])));
      setLoading(false);
    });
  }, []);

  async function unlock(id) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/seekers/${id}/unlock`, { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setRevealed((r) => ({ ...r, [id]: j.data.contact }));
      toast("Seeker contact unlocked", { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="mt-6 text-sm text-ink-faint">Loading…</p>;
  if (requests.length === 0) return <div className="mt-6 card text-center text-sm text-ink-faint">No open requests right now.</div>;

  return (
    <>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {requests.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand">{catMap[r.category] || "Request"}</span>
              <span className="text-xs text-ink-faint">expires {new Date(r.expiresAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-2 text-ink">{r.details}</p>
            <p className="mt-1 text-sm text-ink-faint">
              Budget: {money(r.budgetMin)}–{money(r.budgetMax)} · {r.preferredLocation || "any location"}
            </p>

            {revealed[r.id] ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-800">{revealed[r.id].name}</p>
                <p className="text-emerald-700">{revealed[r.id].phone}</p>
                {revealed[r.id].preferredContactTime && <p className="text-xs text-emerald-600">Best time: {revealed[r.id].preferredContactTime}</p>}
              </div>
            ) : (
              <button className="btn-primary mt-3 w-full" disabled={busyId === r.id} onClick={() => unlock(r.id)}>
                {busyId === r.id ? "Unlocking…" : "Unlock seeker contact"}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
