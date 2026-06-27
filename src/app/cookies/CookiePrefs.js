"use client";

import { useEffect, useState } from "react";

export default function CookiePrefs() {
  const [prefs, setPrefs] = useState({ analytics: false, preferences: false });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cookies")
      .then((r) => r.json())
      .then((j) => {
        if (j.data?.prefs) setPrefs({ analytics: !!j.data.prefs.analytics, preferences: !!j.data.prefs.preferences });
        setLoading(false);
      });
  }, []);

  async function save() {
    await fetch("/api/cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <p className="mt-6 text-sm text-ink-faint">Loading...</p>;

  return (
    <div className="mt-6 space-y-4">
      <Row title="Essential" desc="Required for login, token unlocks and payment tracking." checked disabled />
      <Row title="Analytics" desc="Helps improve search and recommendations." checked={prefs.analytics}
        onChange={(v) => setPrefs({ ...prefs, analytics: v })} />
      <Row title="Preferences" desc="Remembers saved settings and UI choices." checked={prefs.preferences}
        onChange={(v) => setPrefs({ ...prefs, preferences: v })} />

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save}>Save preferences</button>
        {saved && <span className="text-sm font-semibold text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}

function Row({ title, desc, checked, disabled, onChange }) {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div>
        <p className="font-bold text-ink">{title}</p>
        <p className="text-sm text-ink-faint">{desc}</p>
      </div>
      <input type="checkbox" className="h-5 w-5" checked={checked} disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)} />
    </div>
  );
}
