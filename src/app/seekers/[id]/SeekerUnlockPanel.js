"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ExternalLink, LockKeyhole, Phone } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatRwf } from "@/lib/format";

/**
 * The seeker view-token gate.
 *
 * Adapted from the listing `UnlockPanel`, with two deliberate differences.
 * There is no buyer/tenant/client tier here, because a seeker request has a
 * single view-token price. And the seeker unlock route answers with
 * `needsPayment` rather than the listing route's `needsOtp`/`needsVerify`, so
 * the pending branch is shaped around a provider redirect.
 *
 * `POST /api/payments/:id/verify` settles a SEEKER_VIEW payment and creates the
 * unlock, but it returns only `{ paid: true }` — the contact is not in that
 * response. So once it settles we re-read the request to get the revealed
 * contact rather than assuming what it would have been.
 */
export default function SeekerUnlockPanel({
  requestId,
  loggedIn,
  isSeeker,
  area,
  viewToken,
  initialRevealed,
}) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [revealed, setRevealed] = useState(initialRevealed || null);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchRevealed() {
    const res = await fetch(`/api/seekers/${requestId}`);
    const j = await res.json();
    if (!j.success) throw new Error(j.error || "Could not load the contact");
    if (!j.data.revealed) return null;
    return j.data.revealed;
  }

  async function unlock() {
    setLoading(true);
    try {
      const res = await fetch(`/api/seekers/${requestId}/unlock`, { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);

      if (j.data.contact) {
        setRevealed({ contact: j.data.contact, watermark: j.data.watermark });
        toast("Seeker contact unlocked", { type: "success" });
        return;
      }
      if (j.data.needsPayment) {
        setPending({ paymentId: j.data.paymentId, redirectUrl: j.data.redirectUrl || null });
        // No success toast here. The payment has only been started, and saying
        // "unlocked" at this point is how the browse list used to mislead.
        toast("Payment started. Complete it to reveal the contact.", { type: "info" });
        return;
      }
      throw new Error("The unlock did not complete. Please try again.");
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function confirmPayment() {
    if (!pending?.paymentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/${pending.paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);

      const contact = await fetchRevealed();
      if (!contact) throw new Error("Payment went through but the contact is not available yet.");
      setRevealed(contact);
      setPending(null);
      toast("Seeker contact unlocked", { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (revealed) return <RevealedContact revealed={revealed} isSeeker={isSeeker} />;

  return (
    <div className="card !p-4">
      <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
        <LockKeyhole className="h-4 w-4 text-brand" /> Seeker contact locked
      </p>
      <p className="mt-1 text-xs font-semibold text-ink-faint">
        Looking in {area || "any location"}
      </p>

      {!loggedIn ? (
        <>
          {/* The unlock endpoint requires authentication, so offering the button
              to a signed-out visitor would only produce a 401. */}
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="btn-primary mt-4 w-full"
          >
            Sign in to unlock
          </Link>
          <p className="mt-2 text-[11px] font-semibold text-ink-faint">
            The view token is {formatRwf(viewToken)}.
          </p>
        </>
      ) : pending ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold leading-5 text-ink-soft">
            Your payment of {formatRwf(viewToken)} has been started but not confirmed yet.
          </p>
          {pending.redirectUrl && (
            <a
              href={pending.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full"
            >
              <ExternalLink className="h-4 w-4" /> Complete payment
            </a>
          )}
          <button className="btn-outline w-full" disabled={loading} onClick={confirmPayment}>
            {loading ? "Checking..." : "I have paid — check again"}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <button className="btn-primary w-full" disabled={loading} onClick={unlock}>
            {loading ? "Processing..." : `Pay ${formatRwf(viewToken)} & unlock`}
          </button>
          <p className="text-[11px] font-semibold text-ink-faint">
            Non-refundable view token. Reveals the seeker&apos;s name, phone and preferred
            contact time.
          </p>
        </div>
      )}
    </div>
  );
}

function RevealedContact({ revealed, isSeeker }) {
  const c = revealed.contact || {};
  const nothingStored = !c.name && !c.phone;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
        <CheckCircle2 className="h-3.5 w-3.5" /> {isSeeker ? "Your contact details" : "Contact unlocked"}
      </div>

      {nothingStored ? (
        // The seeker form lets the phone be left blank and falls back to the
        // profile, so a request can genuinely carry no number. Better to say so
        // than to render an empty row that looks like a loading bug.
        <p className="text-sm font-semibold text-emerald-900">
          This seeker did not leave contact details. Reach them through the platform instead.
        </p>
      ) : (
        <dl className="space-y-1 text-sm">
          {c.name && <Field k="Name" v={c.name} />}
          {c.phone && (
            <Field
              k="Phone"
              v={
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-emerald-950 underline"
                >
                  <Phone className="h-3.5 w-3.5" /> {c.phone}
                </a>
              }
            />
          )}
          {c.preferredContactTime && <Field k="Best time" v={c.preferredContactTime} />}
        </dl>
      )}

      {revealed.watermark && !isSeeker && (
        <p className="mt-3 select-none text-[11px] italic text-emerald-700/70">
          Issued to {revealed.watermark}. Sharing is logged and prohibited.
        </p>
      )}
    </div>
  );
}

function Field({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-emerald-200/70 py-1.5 last:border-0">
      <dt className="text-emerald-700">{k}</dt>
      <dd className="text-right font-semibold text-emerald-950">{v}</dd>
    </div>
  );
}
