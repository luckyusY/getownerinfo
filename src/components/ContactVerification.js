"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Loader2, Mail, Phone, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const CHANNELS = [
  { key: "email", label: "Email address", icon: Mail },
  { key: "phone", label: "Phone number", icon: Phone },
];

/**
 * Email and phone OTP verification (spec Part 12). A listing cannot be
 * submitted until the account's email is verified.
 */
export default function ContactVerification() {
  const { toast } = useToast();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  // Which channel currently has a code outstanding, and the code being typed.
  const [pending, setPending] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/verification/contact");
      const json = await res.json();
      if (json.success) setState(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendCode(channel) {
    setBusy(true);
    try {
      const res = await fetch("/api/verification/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPending(channel);
      setCode(json.data.devOtp || "");
      toast(
        json.data.devOtp
          ? `Development mode: your code is ${json.data.devOtp}`
          : `Code sent. It expires in ${json.data.expiresInMinutes} minutes.`,
        { type: "success" }
      );
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmCode(channel) {
    setBusy(true);
    try {
      const res = await fetch("/api/verification/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, code: code.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast(`${channel === "email" ? "Email" : "Phone"} verified.`, { type: "success" });
      setPending(null);
      setCode("");
      await load();
    } catch (err) {
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm font-semibold text-ink-faint">Loading verification status…</p>;
  }
  if (!state) return null;

  return (
    <div className="grid gap-3">
      {CHANNELS.map(({ key, label, icon: Icon }) => {
        const channel = state[key];
        const isPending = pending === key;
        const missingValue = !channel.value;

        return (
          <div key={key} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  channel.verified ? "bg-emerald-50 text-emerald-600" : "bg-panel text-ink-soft"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{label}</p>
                <p className="truncate text-xs font-semibold text-ink-faint">
                  {channel.value || "Not set on your profile yet"}
                </p>
              </div>

              {channel.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                  <ShieldAlert className="h-3.5 w-3.5" /> Not verified
                </span>
              )}
            </div>

            {!channel.verified && (
              <div className="mt-3 border-t border-line pt-3">
                {!channel.deliverable && key === "phone" ? (
                  <p className="text-xs font-semibold text-ink-soft">
                    SMS delivery is not configured yet, so phone verification is not required to
                    submit a listing. Verify your email instead.
                  </p>
                ) : isPending ? (
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-0 flex-1">
                      <span className="mb-1 block text-xs font-bold text-ink-soft">
                        Enter the 6-digit code
                      </span>
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="123456"
                        className="input tracking-[0.3em]"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={busy || code.trim().length !== 6}
                      onClick={() => confirmCode(key)}
                      className="btn-primary"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => sendCode(key)}
                      className="btn-outline"
                    >
                      Resend
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || missingValue}
                      onClick={() => sendCode(key)}
                      className="btn-primary"
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send code
                    </button>
                    {missingValue && (
                      <span className="text-xs font-semibold text-ink-faint">
                        Add a phone number above first.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!state.email.verified && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          You need a verified email address before you can submit a listing for approval.
        </p>
      )}
    </div>
  );
}
