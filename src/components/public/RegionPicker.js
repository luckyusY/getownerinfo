"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe, MapPin } from "lucide-react";

/**
 * Country and language controls from the header design.
 *
 * Only Rwanda and English are live today, so the picker states the current
 * selection and says what is coming rather than offering choices that silently
 * do nothing. The selection is remembered per browser.
 */
const COUNTRIES = [{ code: "RW", label: "Rwanda", available: true }];
const LANGUAGES = [
  { code: "EN", label: "English", available: true },
  { code: "FR", label: "Français", available: false },
  { code: "RW", label: "Kinyarwanda", available: false },
];

function useDismiss(ref, onDismiss) {
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onDismiss();
    }
    function onKey(e) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onDismiss]);
}

export default function RegionPicker() {
  const [open, setOpen] = useState(null);
  const [lang, setLang] = useState("EN");
  const ref = useRef(null);
  useDismiss(ref, () => setOpen(null));

  // Per-viewer convenience only; safe to come back empty.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("goi.lang");
      if (saved && LANGUAGES.some((l) => l.code === saved && l.available)) setLang(saved);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  function chooseLang(code) {
    setLang(code);
    setOpen(null);
    try {
      window.localStorage.setItem("goi.lang", code);
    } catch {
      /* ignore */
    }
  }

  return (
    // xl and up only. Below that the logo, nav and account cluster already need
    // more than the content width, and flexbox was squashing all three to hide
    // it. Nothing is lost: Rwanda is the only country and English the only live
    // language, so the picker states a fact rather than offering a choice.
    <div ref={ref} className="hidden items-center gap-1 xl:flex">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === "country" ? null : "country")}
          aria-expanded={open === "country"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-sm font-bold text-ink-soft transition hover:border-brand/40 hover:text-ink"
        >
          <MapPin className="h-4 w-4 text-brand" />
          Rwanda
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open === "country" && (
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-line bg-surface p-2 shadow-lift">
            {COUNTRIES.map((c) => (
              <span key={c.code} className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand">
                {c.label}
                <span className="text-[10px] font-black uppercase">Current</span>
              </span>
            ))}
            <p className="px-3 py-2 text-xs font-semibold text-ink-faint">
              More countries are not open yet.
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(open === "lang" ? null : "lang")}
          aria-expanded={open === "lang"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-sm font-bold text-ink-soft transition hover:border-brand/40 hover:text-ink"
        >
          <Globe className="h-4 w-4" />
          {lang}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open === "lang" && (
          <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-line bg-surface p-2 shadow-lift">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                disabled={!l.available}
                onClick={() => chooseLang(l.code)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-bold transition ${
                  lang === l.code
                    ? "bg-brand-50 text-brand"
                    : l.available
                      ? "text-ink-soft hover:bg-panel hover:text-ink"
                      : "cursor-not-allowed text-ink-faint"
                }`}
              >
                {l.label}
                {!l.available && <span className="text-[10px] font-black uppercase">Soon</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
