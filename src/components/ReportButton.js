"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { Flag } from "lucide-react";

const REASONS = [
  ["fake_listing", "Fake or duplicate listing"],
  ["not_the_owner", "Person is not the real owner"],
  ["wrong_or_dead_contact", "Contact details are wrong"],
  ["already_sold_or_rented", "Already sold or rented"],
  ["misleading_price", "Misleading price"],
  ["scam_or_fraud", "Scam or fraud"],
  ["other", "Something else"],
];

export default function ReportButton({ listingId }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0][0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast("Report submitted. Our team will review it.", { type: "success" });
      setOpen(false);
      setDetails("");
    } catch (err) {
      toast(err.message || "Could not submit report", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-faint transition hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-line bg-panel p-4">
      <p className="text-sm font-black text-ink">Report this listing</p>
      <p className="mt-1 text-xs text-ink-soft">
        Reports are confidential. The owner is not told who reported them.
      </p>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
      >
        {REASONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Anything else we should know? (optional)"
        className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
      <div className="mt-3 flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : "Submit report"}</button>
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
