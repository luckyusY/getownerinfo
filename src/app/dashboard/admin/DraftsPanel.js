"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, FileWarning } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { SectionHeading } from "@/components/ui/Dashboard";
import EmptyState from "@/components/ui/EmptyState";
import { formatRwf, formatDate } from "@/lib/format";

const STALE_OPTIONS = [
  { value: 0, label: "All drafts" },
  { value: 3, label: "Untouched 3+ days" },
  { value: 7, label: "Untouched 7+ days" },
  { value: 30, label: "Abandoned (30+ days)" },
];

/**
 * Incomplete and abandoned listing forms (spec Part 9): how far each one got,
 * what it still needs, and a nudge to the owner.
 */
export default function DraftsPanel() {
  const { toast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staleDays, setStaleDays] = useState(0);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/listings?status=draft&staleDays=${staleDays}`);
      const json = await res.json();
      setListings(json.data?.listings || []);
    } finally {
      setLoading(false);
    }
  }, [staleDays]);

  useEffect(() => {
    load();
  }, [load]);

  async function remind(listing) {
    setBusyId(listing.id);
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast(
        json.data.emailDelivered
          ? `Reminder emailed to ${listing.ownerName}`
          : `Reminder posted in-app (no email provider configured)`,
        { type: "success" }
      );
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-10">
      <SectionHeading
        title="Incomplete listings"
        description="Forms that were started but never submitted, with what each one is still missing."
        action={
          <select
            value={staleDays}
            onChange={(e) => setStaleDays(Number(e.target.value))}
            className="input !w-auto"
            aria-label="Filter by how long the draft has been untouched"
          >
            {STALE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        }
      />

      {loading ? (
        <p className="text-sm font-semibold text-ink-faint">Loading drafts…</p>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No incomplete listings"
          hint="Every started form in this window has been submitted."
        />
      ) : (
        <div className="grid gap-3">
          {listings.map((l) => (
            <div key={l.id} className="card !p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-base font-bold text-ink">{l.title || "(untitled draft)"}</p>
                    <span className="rounded-full bg-panel px-2 py-0.5 text-[11px] font-black text-ink-soft">
                      {l.categoryName}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-ink-faint">
                    {l.ownerName} · {l.ownerEmail} · last touched {formatDate(l.updatedAt)}
                    {l.price > 0 && ` · ${formatRwf(l.price)}`}
                  </p>

                  <div className="mt-3 max-w-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft">
                      <span>Completed</span>
                      <span>{l.completionPercent}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel">
                      <span
                        className={`block h-full rounded-full ${l.completionPercent >= 70 ? "bg-emerald-500" : l.completionPercent >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${l.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {l.missingFields?.length > 0 && (
                    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-amber-800">
                      <FileWarning className="h-3.5 w-3.5 shrink-0" />
                      Still needs: {l.missingFields.join(", ")}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={busyId === l.id}
                  onClick={() => remind(l)}
                  className="btn-outline shrink-0 !py-1.5 !text-xs"
                >
                  <BellRing className="h-3.5 w-3.5" /> Send reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
