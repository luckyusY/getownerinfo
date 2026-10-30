"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { AlertTriangle, CheckCircle2, Flag, Trash2, XCircle } from "lucide-react";

const REASON_LABELS = {
  fake_listing: "Fake/duplicate",
  not_the_owner: "Not the owner",
  wrong_or_dead_contact: "Bad contact",
  already_sold_or_rented: "Already taken",
  misleading_price: "Misleading price",
  scam_or_fraud: "Scam/fraud",
  other: "Other",
};

export default function ReportsQueue() {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports?status=open");
      const j = await res.json();
      setGroups(j.data?.groups || []);
    } catch {
      /* leave empty */
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function resolve(listingId, action, takedown = false) {
    // Cancel used to fall through to the default text and resolve the report
    // regardless — on the uphold path that takes the listing down.
    const upholding = action === "uphold";
    const entered = prompt(
      upholding ? "What did you find? (shown to the owner)" : "Why is this being dismissed? (internal)"
    );
    if (entered === null) return;
    const resolution = entered.trim()
      || (upholding ? "Reported by users and found to breach our rules" : "No violation found");
    setBusyId(listingId);
    try {
      const res = await fetch("/api/admin/reports/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, action, resolution, takedown }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast(
        action === "uphold" ? (takedown ? "Upheld and listing removed" : "Report upheld") : "Reports dismissed",
        { type: action === "uphold" ? "success" : "info" }
      );
      setGroups((gs) => gs.filter((g) => g.listingId !== listingId));
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="mt-10 text-sm font-semibold text-ink-soft">Loading reports...</p>;

  return (
    <section className="mt-10">
      <SectionHeading
        title={`User reports (${groups.length})`}
        description="Listings flagged by buyers, most-reported first. Multiple independent reporters is the strongest signal."
      />
      {groups.length === 0 ? (
        <EmptyState title="No open reports" hint="Listings reported by users will appear here." />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g.listingId} className="card premium-hover !p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold text-ink">{g.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${g.count >= 3 ? "bg-red-50 text-red-700" : "bg-panel text-ink-soft"}`}>
                      <Flag className="h-3.5 w-3.5" /> {g.count} report{g.count === 1 ? "" : "s"}
                    </span>
                    {Object.entries(g.reasons).map(([reason, n]) => (
                      <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-panel px-2.5 py-1 text-ink-soft">
                        {REASON_LABELS[reason] || reason} × {n}
                      </span>
                    ))}
                    {g.reviewFlag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5" /> Auto-flagged
                      </span>
                    )}
                  </div>
                  <button
                    className="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-brand hover:underline"
                    onClick={() => setExpanded(expanded === g.listingId ? null : g.listingId)}
                  >
                    {expanded === g.listingId ? "Hide details" : "Show what reporters said"}
                  </button>
                  {expanded === g.listingId && (
                    <ul className="mt-2 space-y-2">
                      {g.reports.map((r) => (
                        <li key={r.id} className="rounded-lg bg-panel px-3 py-2 text-xs text-ink-soft">
                          <span className="font-bold text-ink">{REASON_LABELS[r.reason] || r.reason}</span>
                          {r.details ? ` — ${r.details}` : ""}
                          <span className="ml-1 text-ink-faint">({new Date(r.at).toLocaleDateString()})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/listings/${g.listingId}`} target="_blank" className="btn-outline">View</Link>
                  <button className="btn-primary" disabled={busyId === g.listingId} onClick={() => resolve(g.listingId, "uphold", true)}>
                    <Trash2 className="h-4 w-4" /> Uphold & remove
                  </button>
                  <button className="btn-outline" disabled={busyId === g.listingId} onClick={() => resolve(g.listingId, "uphold", false)}>
                    <CheckCircle2 className="h-4 w-4" /> Uphold only
                  </button>
                  <button className="btn-outline" disabled={busyId === g.listingId} onClick={() => resolve(g.listingId, "dismiss")}>
                    <XCircle className="h-4 w-4" /> Dismiss
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
