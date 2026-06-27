"use client";

import { useEffect, useState } from "react";
import { formatRwf } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { BadgeCheck, Banknote, CheckCircle2, FileCheck2, MapPin, XCircle } from "lucide-react";

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
      <SectionHeading
        title={`Pending approvals (${listings.length})`}
        description="Review owner submissions, proof coverage, pricing, and location quality before activation."
      />
      {listings.length === 0 ? (
        <EmptyState title="Nothing waiting for review" hint="New owner submissions will appear here." />
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card premium-hover !p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">{l.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {l.ownerName} - {l.ownerEmail}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-ink-soft">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand">
                      <BadgeCheck className="h-3.5 w-3.5" /> Model {l.model}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1">
                      <Banknote className="h-3.5 w-3.5 text-clay" /> {formatRwf(l.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 capitalize">
                      {l.transactionType} {l.itemType ? `- ${l.itemType}` : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1">
                      <MapPin className="h-3.5 w-3.5 text-brand" /> {l.location?.area || "Area missing"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1">
                      <FileCheck2 className="h-3.5 w-3.5" /> {(l.ownershipProof || []).length} proof files
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn-primary" disabled={busyId === l.id} onClick={() => moderate(l.id, "approve")}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button className="btn-outline" disabled={busyId === l.id} onClick={() => moderate(l.id, "reject")}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
