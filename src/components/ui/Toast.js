"use client";

import { createContext, useContext, useCallback, useState } from "react";

const ToastCtx = createContext(null);

export function useToast() {
  return useContext(ToastCtx) || { toast: () => {} };
}

const ICONS = { success: "OK", error: "!", info: "i", warning: "!" };
const STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-brand/30 bg-brand-50 text-brand-dark",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};
const ICON_BG = {
  success: "bg-emerald-600",
  error: "bg-red-600",
  info: "bg-brand",
  warning: "bg-amber-500",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, type: opts.type || "info" }]);
      setTimeout(() => remove(id), opts.duration || 4000);
    },
    [remove]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex animate-fade-up items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lift ${STYLES[t.type]}`}
          >
            <span className={`mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${ICON_BG[t.type]}`}>
              {ICONS[t.type]}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 text-current/60 hover:text-current" aria-label="Dismiss">x</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
