"use client";

import { useState } from "react";
import Link from "next/link";

function money(n) {
  return n == null ? "—" : new Intl.NumberFormat("en-RW").format(n) + " Rwf";
}

function RevealedContact({ revealed }) {
  const c = revealed.contact || {};
  const loc = revealed.exactLocation || {};
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
        ✓ Access Unlocked
      </div>
      <dl className="space-y-1 text-sm">
        {c.ownerName && <Field k="Owner" v={`${c.ownerName} · ${c.ownerPhone || ""}`} />}
        {c.keysManagerName && <Field k="Keys manager" v={`${c.keysManagerName} · ${c.keysManagerPhone || ""}`} />}
        {c.thirdPartyContact && <Field k="Caretaker" v={c.thirdPartyContact} />}
        {(loc.upi || loc.street) && (
          <Field
            k="Exact location"
            v={[loc.street, loc.houseNumber && `No. ${loc.houseNumber}`, loc.upi && `UPI ${loc.upi}`].filter(Boolean).join(", ")}
          />
        )}
        {loc.mapsPin?.lat && <Field k="Map pin" v={`${loc.mapsPin.lat}, ${loc.mapsPin.lng}`} />}
      </dl>
      {revealed.watermark && (
        <p className="mt-3 select-none text-[11px] italic text-emerald-700/70">
          Issued to {revealed.watermark} — sharing is logged and prohibited.
        </p>
      )}
    </div>
  );
}

function Field({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-emerald-700">{k}</dt>
      <dd className="text-right font-medium text-emerald-900">{v}</dd>
    </div>
  );
}

export default function UnlockPanel({ listingId, loggedIn, area, initialRevealed, tokenFees }) {
  const [revealed, setRevealed] = useState(initialRevealed || null);
  const [tier, setTier] = useState("buyer");
  const [stage, setStage] = useState("idle"); // idle | otp
  const [paymentId, setPaymentId] = useState(null);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fee = tokenFees?.[tier];

  async function initiate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      if (j.data.alreadyUnlocked || j.data.unlocked) {
        setRevealed(j.data);
      } else if (j.data.needsOtp) {
        setPaymentId(j.data.paymentId);
        setDevOtp(j.data.devOtp || null);
        setStage("otp");
      } else if (j.data.needsVerify) {
        setPaymentId(j.data.paymentId);
        await verify(j.data.paymentId, "");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(pid = paymentId, code = otp) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payments/${pid}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: code }),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      setRevealed(j.data);
      setStage("idle");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (revealed) return <RevealedContact revealed={revealed} />;

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
      <p className="text-sm font-medium text-slate-700">🔒 Contact &amp; exact location locked</p>
      <p className="mt-1 text-xs text-slate-500">Approximate area: {area || "—"}</p>

      {error && <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">{error}</p>}

      {!loggedIn ? (
        <Link href="/login" className="btn-primary mt-3 inline-block w-full">Log in to unlock</Link>
      ) : stage === "otp" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-600">Enter the 6-digit code sent to your email.</p>
          {devOtp && <p className="text-xs text-amber-600">Dev code: <strong>{devOtp}</strong></p>}
          <input
            className="input text-center tracking-widest"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
          />
          <button className="btn-primary w-full" disabled={loading || otp.length !== 6} onClick={() => verify()}>
            {loading ? "Verifying…" : "Confirm & unlock"}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <select className="input" value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="buyer">Buyer</option>
            <option value="tenant">Tenant</option>
            <option value="client">Client</option>
          </select>
          <button className="btn-primary w-full" disabled={loading} onClick={initiate}>
            {loading ? "Processing…" : `Pay ${money(fee)} & unlock`}
          </button>
          <p className="text-[11px] text-slate-400">Non-refundable token fee. Reveals owner contact &amp; exact location.</p>
        </div>
      )}
    </div>
  );
}
