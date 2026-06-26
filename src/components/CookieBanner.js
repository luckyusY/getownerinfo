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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-4 shadow-lg">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          We use essential cookies to run the platform (login, token unlocks, payments).
          Optional cookies help with analytics and saved preferences. See our{" "}
          <Link href="/privacy" className="text-brand underline">Privacy Policy</Link>.
          {customizing && (
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked disabled /> Essential (always on)
              </label>
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={prefs.analytics} onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })} /> Analytics
              </label>
              <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={prefs.preferences} onChange={(e) => setPrefs({ ...prefs, preferences: e.target.checked })} /> Preferences
              </label>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {customizing ? (
            <button className="btn-primary" onClick={() => save(prefs)}>Save choices</button>
          ) : (
            <>
              <button className="btn-outline" onClick={() => save({ analytics: false, preferences: false })}>Essential only</button>
              <button className="btn-outline" onClick={() => setCustomizing(true)}>Customize</button>
              <button className="btn-primary" onClick={() => save({ analytics: true, preferences: true })}>Accept all</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
