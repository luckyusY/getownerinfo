"use client";

import { useEffect, useState } from "react";
import { Banknote, Bell, Home, MessageSquareText, UserCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const GROUPS = [
  {
    key: "listings",
    icon: Home,
    label: "Listings and requests",
    hint: "Submitted, approved, rejected, expiring, and responses to your requests.",
  },
  {
    key: "messages",
    icon: MessageSquareText,
    label: "Messages",
    hint: "When a buyer or owner sends you a message.",
  },
  {
    key: "payments",
    icon: Banknote,
    label: "Payments and invoices",
    hint: "Receipts, contact unlocks, commission invoices and penalties.",
  },
  {
    key: "account",
    icon: UserCircle,
    label: "Account and verification",
    hint: "Verification decisions and other account changes.",
  },
];

// Anything that carries money or access is sent regardless of preference.
const ALWAYS_ON = new Set(["payments", "account"]);

export default function NotificationPrefs() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setPrefs(j.data.emailNotifications);
      })
      .catch(() => {});
  }, []);

  async function toggle(key, value) {
    const previous = prefs;
    setPrefs((p) => ({ ...p, [key]: value }));
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: { [key]: value } }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPrefs(json.data.emailNotifications);
      toast("Notification preferences saved", { type: "success" });
    } catch (err) {
      setPrefs(previous);
      toast(err.message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!prefs) {
    return <p className="text-sm font-semibold text-ink-faint">Loading preferences…</p>;
  }

  return (
    <div className="grid gap-2">
      <p className="flex items-start gap-2 rounded-xl border border-line bg-panel/60 px-3.5 py-2.5 text-xs font-semibold text-ink-soft">
        <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        In-app notifications are always on. These control email only — and
        payment, invoice and verification messages are sent either way.
      </p>

      {GROUPS.map(({ key, icon: Icon, label, hint }) => {
        const locked = ALWAYS_ON.has(key);
        const checked = locked ? true : prefs[key] !== false;
        return (
          <label
            key={key}
            className={`flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 ${
              locked ? "opacity-80" : "cursor-pointer hover:border-brand/40"
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-ink">{label}</span>
              <span className="block text-xs font-semibold leading-5 text-ink-faint">{hint}</span>
              {locked && (
                <span className="mt-1 inline-block rounded-full bg-panel px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-ink-soft">
                  Always sent
                </span>
              )}
            </span>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-brand"
              checked={checked}
              disabled={locked || busy}
              onChange={(e) => toggle(key, e.target.checked)}
              aria-label={`Email me about ${label}`}
            />
          </label>
        );
      })}
    </div>
  );
}
