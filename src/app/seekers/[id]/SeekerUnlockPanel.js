"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

  // The background check reads the payment id through a ref so that settling
  // it does not re-create the attempt function and restart the interval.
  const pendingRef = useRef(null);
  pendingRef.current = pending;

  const fetchRevealed = useCallback(async () => {
    const res = await fetch(`/api/seekers/${requestId}`);
    const j = await res.json();
    if (!j.success) throw new Error(j.error || "Could not load the contact");
    if (!j.data.revealed) return null;
    return j.data.revealed;
  }, [requestId]);

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

  /**
   * One attempt at settling the started payment.
   *
   * Shared by the button and the background check below, which is why it
   * reports rather than toasts: a background attempt that finds the payment
   * still pending is the expected case, not an error worth interrupting for.
   */
  const attemptSettle = useCallback(async () => {
    if (!pendingRef.current?.paymentId) return { done: false };
    const res = await fetch(`/api/payments/${pendingRef.current.paymentId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const j = await res.json();
    if (!j.success) return { done: false, error: j.error };

    const contact = await fetchRevealed();
    if (!contact) {
      return { done: false, error: "Payment went through but the contact is not available yet." };
    }
    setRevealed(contact);
    setPending(null);
    return { done: true };
  }, [fetchRevealed]);

  async function confirmPayment() {
    setLoading(true);
    try {
      const result = await attemptSettle();
      if (!result.done) throw new Error(result.error || "The payment has not settled yet.");
      toast("Seeker contact unlocked", { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  /**
   * While a payment is outstanding, check for it instead of waiting to be
   * asked. Mobile money settles seconds to minutes after the user approves it
   * on their handset, by which point they are looking at this panel — so the
   * contact should appear on its own rather than behind a button they have to
   * guess the right moment to press.
   *
   * Hidden tabs are skipped, and the checking stops after a few minutes so a
   * forgotten tab is not left polling for the rest of the day.
   */
  useEffect(() => {
    if (!pending?.paymentId) return;
    let stopped = false;
    const until = Date.now() + 5 * 60 * 1000;

    async function check() {
      if (stopped || document.hidden || Date.now() > until) return;
      try {
        const result = await attemptSettle();
        if (result.done && !stopped) toast("Payment confirmed — contact unlocked", { type: "success" });
      } catch {
        // A failed check is not worth reporting: the next one will try again,
        // and the button is still there if the user wants to force it.
      }
    }

    const timer = setInterval(check, 8000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [pending, attemptSettle, toast]);

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
            {loading ? "Checking..." : "I have paid — check now"}
          </button>
          <p className="text-[11px] font-semibold text-ink-faint">
            Keep this page open: it checks every few seconds and the contact appears here on
            its own once the payment lands.
          </p>
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
