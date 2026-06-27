"use client";

import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";

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

  if (loading) return <p className="mt-10 text-sm font-semibold text-ink-soft">Loading queue...</p>;

  return (
    <section className="mt-10">
      <SectionHeading title={`Pending approvals (${listings.length})`} />
      {listings.length === 0 ? (
        <EmptyState title="Nothing waiting for review" hint="New owner submissions will appear here." />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card !p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{l.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {l.ownerName} - {l.ownerEmail}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Model {l.model} - {formatRwf(l.price)} - {l.transactionType} - {l.itemType}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Area: {l.location?.area || "Not provided"} - Proof files: {(l.ownershipProof || []).length}
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
    </section>
  );
}
