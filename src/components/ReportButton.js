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

/**
 * Someone who paid is complaining about what they bought, not flagging a
 * listing they walked past. The wording and the ordering follow that: the
 * contact failing is why they are here, so it leads.
 */
const PAID_REASONS = [
  ["wrong_or_dead_contact", "The contact did not work"],
  ["not_the_owner", "The person is not the owner"],
  ["already_sold_or_rented", "Already sold or rented"],
  ["fake_listing", "The listing is fake"],
  ["misleading_price", "The price was misleading"],
  ["scam_or_fraud", "Scam or fraud"],
  ["other", "Something else"],
];

/**
 * @param {object}  props
 * @param {string}  props.listingId
 * @param {string} [props.unlockId]  the unlock this is about, when the reporter
 *   paid for the contact. The server reads the amount from the record itself.
 * @param {string} [props.label]     link text
 * @param {string} [props.className] classes for the trigger
 */
export default function ReportButton({ listingId, unlockId, label, className }) {
  const { toast } = useToast();
  const paid = Boolean(unlockId);
  const reasons = paid ? PAID_REASONS : REASONS;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0][0]);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, reason, details, unlockId }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      toast(
        paid
          ? "Reported. We will check the contact and come back to you."
          : "Report submitted. Our team will review it.",
        { type: "success" }
      );
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
        className={
          className ||
          "inline-flex min-h-11 items-center gap-1.5 text-xs font-bold text-ink-faint transition hover:text-red-600"
        }
      >
        <Flag className="h-3.5 w-3.5" />
        {label || (paid ? "Report a problem" : "Report this listing")}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 rounded-xl border border-line bg-panel p-4">
      <p className="text-sm font-black text-ink">
        {paid ? "Report a problem with what you unlocked" : "Report this listing"}
      </p>
      <p className="mt-1 text-xs text-ink-soft">
        Reports are confidential. The owner is not told who reported them.
      </p>
      {/* "Non-refundable" is the only thing the paywall copy used to say, which
          reads as "no recourse". This is the recourse, stated plainly. */}
      {paid && (
        <p className="mt-2 text-xs font-semibold leading-5 text-ink-soft">
          The token fee is not refunded, but we check the contact ourselves. If it is
          wrong the listing comes down, and you will be told the outcome.
        </p>
      )}
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-brand"
      >
        {reasons.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={paid ? "What happened when you tried the contact? (optional)" : "Anything else we should know? (optional)"}
        className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand"
      />
      <div className="mt-3 flex gap-2">
        <button className="btn-primary" disabled={busy}>{busy ? "Sending…" : "Submit report"}</button>
        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
