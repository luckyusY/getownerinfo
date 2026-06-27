"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import EmptyState from "@/components/ui/EmptyState";
import { Banknote, CalendarClock, KeyRound, MapPin, Phone, Search } from "lucide-react";

function money(n) {
  return n ? new Intl.NumberFormat("en-RW").format(n) + " Rwf" : "-";
}

export default function SeekersBrowse() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [revealed, setRevealed] = useState({});
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

  if (loading) return <p className="mt-6 text-sm font-semibold text-ink-faint">Loading requests...</p>;
  if (requests.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState icon="?" title="No open requests right now" hint="Fresh seeker requests will appear here when buyers post what they need." />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      {requests.map((r) => (
        <div key={r.id} className="card premium-hover">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand">
              <Search className="h-3.5 w-3.5" /> {catMap[r.category] || "Request"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
              <CalendarClock className="h-3.5 w-3.5" /> Expires {new Date(r.expiresAt).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink">{r.details}</p>

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-panel px-3 py-2 font-semibold text-ink-soft">
              <Banknote className="h-4 w-4 text-clay" /> {money(r.budgetMin)} to {money(r.budgetMax)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-panel px-3 py-2 font-semibold text-ink-soft">
              <MapPin className="h-4 w-4 text-brand" /> {r.preferredLocation || "Any location"}
            </span>
          </div>

          {revealed[r.id] ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
              <p className="font-bold text-emerald-900">{revealed[r.id].name}</p>
              <p className="inline-flex items-center gap-1.5 text-emerald-800">
                <Phone className="h-4 w-4" /> {revealed[r.id].phone}
              </p>
              {revealed[r.id].preferredContactTime && (
                <p className="mt-1 text-xs font-semibold text-emerald-700">Best time: {revealed[r.id].preferredContactTime}</p>
              )}
            </div>
          ) : (
            <button className="btn-primary mt-4 w-full" disabled={busyId === r.id} onClick={() => unlock(r.id)}>
              <KeyRound className="h-4 w-4" /> {busyId === r.id ? "Unlocking..." : "Unlock seeker contact"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
