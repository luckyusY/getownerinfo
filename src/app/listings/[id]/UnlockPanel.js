"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ExternalLink, LockKeyhole } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

function money(n) {
  return n == null ? "-" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

function RevealedContact({ revealed, unlockId }) {
  const c = revealed.contact || {};
  const loc = revealed.exactLocation || {};
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-soft">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
        <CheckCircle2 className="h-3.5 w-3.5" /> Access unlocked
      </div>
      <dl className="space-y-1 text-sm">
        {c.ownerName && <Field k="Owner" v={`${c.ownerName} - ${c.ownerPhone || ""}`} />}
        {c.keysManagerName && <Field k="Keys manager" v={`${c.keysManagerName} - ${c.keysManagerPhone || ""}`} />}
        {c.thirdPartyContact && <Field k="Caretaker" v={c.thirdPartyContact} />}
        {(loc.upi || loc.street) && (
          <Field
            k="Exact location"
            v={[loc.street, loc.houseNumber && `No. ${loc.houseNumber}`, loc.upi && `UPI ${loc.upi}`].filter(Boolean).join(", ")}
          />
        )}
        {loc.mapsPin?.lat && <Field k="Map pin" v={`${loc.mapsPin.lat}, ${loc.mapsPin.lng}`} />}
      </dl>

      {/* The listing page refuses anything that is not ACTIVE, so this panel
          disappears the moment the listing sells or expires. The contact sheet
          is where the purchase actually lives. */}
      <Link
        href={unlockId ? `/documents/unlock/${unlockId}` : "/dashboard/unlocks"}
        className="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-emerald-900 underline"
      >
        Save your contact sheet
      </Link>

      {revealed.watermark && (
        <p className="mt-2 select-none text-[11px] italic text-emerald-700/70">
          Issued to {revealed.watermark}. Sharing is logged and prohibited.
        </p>
      )}
    </div>
  );
}

function Field({ k, v }) {
  return (
    <div className="flex justify-between gap-3 border-b border-emerald-200/70 py-1.5 last:border-0">
      <dt className="text-emerald-700">{k}</dt>
      <dd className="text-right font-semibold text-emerald-950">{v}</dd>
    </div>
  );
}

const TIERS = [
  { value: "buyer", label: "Buyer" },
  { value: "tenant", label: "Tenant" },
  { value: "client", label: "Client" },
];

export default function UnlockPanel({ listingId, loggedIn, area, initialRevealed, initialUnlockId, tokenFees }) {
  const { toast } = useToast();
  const pathname = usePathname();
  const [revealed, setRevealed] = useState(initialRevealed || null);
  const [unlockId, setUnlockId] = useState(initialUnlockId || null);
  const [tier, setTier] = useState("buyer");
  const [stage, setStage] = useState("idle"); // idle | otp | pending
  const [paymentId, setPaymentId] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);

  const fee = tokenFees?.[tier];
  // A missing category fee used to render "Pay - Rwf & unlock" on an enabled
  // button, and the server then charged `?? 0`. Nobody should be asked to
  // approve a price the page cannot state.
  const priceKnown = Number.isFinite(fee);

  // Read through a ref so settling the payment does not re-create the poll and
  // restart its interval.
  const paymentRef = useRef(null);
  paymentRef.current = paymentId;

  function reset() {
    setStage("idle");
    setPaymentId(null);
    setRedirectUrl(null);
    setOtp("");
    setDevOtp(null);
  }

  function accept(data) {
    setRevealed(data);
    if (data.unlockId) setUnlockId(data.unlockId);
    reset();
  }

  async function initiate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);

      if (j.data.alreadyUnlocked || j.data.unlocked) {
        accept(j.data);
        toast("Contact unlocked", { type: "success" });
      } else if (j.data.needsOtp) {
        toast("Verification code sent to your email", { type: "info" });
        setPaymentId(j.data.paymentId);
        setDevOtp(j.data.devOtp || null);
        setStage("otp");
      } else if (j.data.needsVerify) {
        // The provider has not settled yet and has handed back a page for the
        // buyer to pay on. This used to call verify() immediately with an
        // empty code, which could only answer "Payment still pending" — so
        // against a real provider the unlock could never complete and the
        // payment page was never shown at all.
        setPaymentId(j.data.paymentId);
        setRedirectUrl(j.data.redirectUrl || null);
        setStage("pending");
        toast("Payment started. Complete it to reveal the contact.", { type: "info" });
      }
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  /**
   * One attempt at settling. Reports rather than toasts, because the
   * background check below treats "still pending" as the expected answer.
   */
  const attemptVerify = useCallback(
    async (code = "") => {
      const pid = paymentRef.current;
      if (!pid) return { done: false };
      const res = await fetch(`/api/payments/${pid}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const j = await res.json();
      if (!j.success) return { done: false, status: res.status, error: j.error };
      return { done: true, data: j.data };
    },
    []
  );

  async function verify() {
    setLoading(true);
    try {
      const result = await attemptVerify(otp);
      if (result.done) {
        accept(result.data);
        toast("Contact unlocked", { type: "success" });
        return;
      }
      // 410 expired, 429 too many attempts. Both told the buyer to "restart the
      // unlock" from a panel with no restart control, so only a page reload
      // recovered. Put them back where they can start again.
      if (result.status === 410 || result.status === 429) {
        reset();
      }
      throw new Error(result.error || "The code could not be confirmed.");
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function checkPaymentNow() {
    setLoading(true);
    try {
      const result = await attemptVerify("");
      if (!result.done) throw new Error(result.error || "The payment has not settled yet.");
      accept(result.data);
      toast("Contact unlocked", { type: "success" });
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  /**
   * While a payment is outstanding, check for it rather than waiting to be
   * asked. Mobile money settles seconds to minutes after the buyer approves it
   * on their handset, by which point they are looking at this panel.
   * Background tabs are skipped and the checking stops after five minutes.
   */
  useEffect(() => {
    if (stage !== "pending" || !paymentId) return;
    let stopped = false;
    const until = Date.now() + 5 * 60 * 1000;

    async function check() {
      if (stopped || document.hidden || Date.now() > until) return;
      try {
        const result = await attemptVerify("");
        if (result.done && !stopped) {
          accept(result.data);
          toast("Payment confirmed — contact unlocked", { type: "success" });
        }
      } catch {
        // Expected while the provider is still working. The next tick retries,
        // and the manual button is there either way.
      }
    }

    const timer = setInterval(check, 8000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [stage, paymentId, attemptVerify, toast]);

  if (revealed) return <RevealedContact revealed={revealed} unlockId={unlockId} />;

  return (
    <div className="rounded-xl border border-dashed border-line bg-panel p-4 text-center">
      <p className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-ink">
        <LockKeyhole className="h-4 w-4 text-brand" /> Contact &amp; exact location locked
      </p>
      <p className="mt-1 text-xs text-ink-faint">Approximate area: {area || "-"}</p>

      {!loggedIn ? (
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="btn-primary mt-3 inline-flex w-full justify-center"
        >
          Log in to unlock
        </Link>
      ) : stage === "otp" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-ink-soft">Enter the 6-digit code sent to your email.</p>
          {devOtp && <p className="text-xs text-clay">Dev code: <strong>{devOtp}</strong></p>}
          <input
            className="input text-center tracking-widest"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
          />
          <button className="btn-primary w-full" disabled={loading || otp.length !== 6} onClick={verify}>
            {loading ? "Verifying..." : "Confirm & unlock"}
          </button>
          {/* There must always be a way out of this step. */}
          <button className="btn-ghost w-full" disabled={loading} onClick={reset}>
            Start again
          </button>
          <p className="text-[11px] text-ink-faint">
            After five wrong codes, or once the code expires, you start again from the
            payment step.
          </p>
        </div>
      ) : stage === "pending" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold leading-5 text-ink-soft">
            Your payment of {money(fee)} has been started but not confirmed yet.
          </p>
          {redirectUrl && (
            <a href={redirectUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
              <ExternalLink className="h-4 w-4" /> Complete payment
            </a>
          )}
          <button className="btn-outline w-full" disabled={loading} onClick={checkPaymentNow}>
            {loading ? "Checking..." : "I have paid — check now"}
          </button>
          <button className="btn-ghost w-full" disabled={loading} onClick={reset}>
            Cancel
          </button>
          <p className="text-[11px] text-ink-faint">
            Keep this page open: it checks every few seconds and the contact appears here on
            its own once the payment lands.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-left">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Unlocking as
            </span>
            <select className="input" value={tier} onChange={(e) => setTier(e.target.value)}>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                  {Number.isFinite(tokenFees?.[t.value]) ? ` — ${money(tokenFees[t.value])}` : ""}
                </option>
              ))}
            </select>
          </label>
          {/* The three tiers are priced differently and reveal exactly the same
              fields (UNLOCKED_FIELDS is a constant), so the price belongs in
              the options where it can be compared, not hidden in the button. */}
          <p className="text-left text-[11px] text-ink-faint">
            All three reveal the same details; pick the one that describes you.
          </p>
          <button className="btn-primary w-full" disabled={loading || !priceKnown} onClick={initiate}>
            {loading ? "Processing..." : priceKnown ? `Pay ${money(fee)} & unlock` : "Price unavailable"}
          </button>
          {!priceKnown && (
            <p className="text-[11px] font-semibold text-red-700">
              We cannot show a price for this listing right now, so it cannot be unlocked.
              Please try again later.
            </p>
          )}
          {/* "Non-refundable" on its own reads as "no recourse". Say what
              actually happens, and that the purchase is kept. */}
          <p className="text-[11px] leading-5 text-ink-faint">
            Non-refundable token fee, up to 20 unlocks a day. You keep a contact sheet for
            every unlock — it stays in your dashboard even if the listing comes down. If the
            contact does not work, report it from that sheet: we check it ourselves, remove
            the listing if it is wrong, and tell you the outcome.
          </p>
        </div>
      )}
    </div>
  );
}
