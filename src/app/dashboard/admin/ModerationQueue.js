"use client";

import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";

export default function ModerationQueue() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

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
    try {
      const res = await fetch(`/api/listings/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast(action === "approve" ? "Listing approved" : "Listing rejected", { type: action === "approve" ? "success" : "info" });
      setListings((ls) => ls.filter((l) => l.id !== id));
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="mt-10 text-sm text-ink-soft">Loading queue…</p>;

  return (
    <div className="mt-10">
      <SectionHeading title={`Pending approvals (${listings.length})`} />
      {listings.length === 0 ? (
        <p className="text-sm text-ink-soft">Nothing waiting for review.</p>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card !p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{l.title}</p>
                  <p className="text-xs text-ink-faint">
                    {l.ownerName} · {l.ownerEmail} · Model {l.model} · {formatRwf(l.price)} · {l.transactionType}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
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
