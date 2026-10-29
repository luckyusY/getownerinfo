"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, preferences: false });

  useEffect(() => {
    fetch("/api/cookies")
      .then((r) => r.json())
      .then((j) => setShow(!j.data?.consented))
      .catch(() => setShow(true));
  }, []);

  async function save(p) {
    await fetch("/api/cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    setShow(false);
  }

  if (!show) return null;

  return (
    // Sits above the bottom tab bar rather than on top of it; --tabbar-h is 0
    // from lg up, where the tab bar is hidden.
    <div
      className="fixed inset-x-0 z-50 border-t border-line bg-white px-4 py-3 shadow-lg sm:p-4"
      style={{ bottom: "calc(var(--tabbar-h) + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="text-xs leading-5 text-ink-soft sm:text-sm">
          {/* The full explanation is long on a phone, where this banner was
              taking a fifth of the screen. Phones get the short version and
              the policy link; larger screens keep the detail. */}
          <span className="sm:hidden">
            We use essential cookies to run the platform. Optional ones help with analytics.{" "}
          </span>
          <span className="hidden sm:inline">
            We use essential cookies to run the platform (login, token unlocks, payments).
            Optional cookies help with analytics and saved preferences. See our{" "}
          </span>
          <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
          {customizing && (
            <div className="mt-3 space-y-2">
              <label className="flex min-h-11 items-center gap-2 text-ink">
                <input type="checkbox" checked disabled className="h-5 w-5 shrink-0" /> Essential (always on)
              </label>
              <label className="flex min-h-11 items-center gap-2 text-ink">
                <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })} className="h-5 w-5 shrink-0" /> Analytics
              </label>
              <label className="flex min-h-11 items-center gap-2 text-ink">
                <input type="checkbox" checked={prefs.preferences} onChange={(e) => setPrefs({ ...prefs, preferences: e.target.checked })} className="h-5 w-5 shrink-0" /> Preferences
              </label>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {customizing ? (
            <button className="btn-primary !py-1.5 !text-xs sm:!py-2 sm:!text-sm" onClick={() => save(prefs)}>
              Save choices
            </button>
          ) : (
            <>
              <button
                className="btn-outline flex-1 !py-1.5 !text-xs sm:flex-none sm:!py-2 sm:!text-sm"
                onClick={() => save({ analytics: false, preferences: false })}
              >
                Essential only
              </button>
              <button
                className="btn-outline flex-1 !py-1.5 !text-xs sm:flex-none sm:!py-2 sm:!text-sm"
                onClick={() => setCustomizing(true)}
              >
                Customize
              </button>
              <button
                className="btn-primary flex-1 !py-1.5 !text-xs sm:flex-none sm:!py-2 sm:!text-sm"
                onClick={() => save({ analytics: true, preferences: true })}
              >
                Accept all
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
