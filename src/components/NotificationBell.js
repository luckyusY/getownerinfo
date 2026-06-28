"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [authed, setAuthed] = useState(true);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) { setAuthed(false); return; }
      const j = await res.json();
      if (j.success) { setItems(j.data.notifications); setUnread(j.data.unread); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 45000); // light polling
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  async function markAll() {
    setUnread(0);
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markAll();
  }

  if (!authed) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full text-white transition hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-xl border border-line bg-white text-ink shadow-lift">
          <div className="flex items-center justify-between border-b border-line bg-brand-50 px-4 py-2.5">
            <p className="text-sm font-black text-ink">Notifications</p>
            <button onClick={markAll} className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => {
                const Wrapper = n.link ? Link : "div";
                return (
                  <Wrapper
                    key={n.id}
                    {...(n.link ? { href: n.link, onClick: () => setOpen(false) } : {})}
                    className={`block border-b border-line/70 px-4 py-3 transition last:border-0 hover:bg-panel ${n.read ? "" : "bg-brand-50/40"}`}
                  >
                    <p className="text-sm font-bold text-ink">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>}
                    <p className="mt-1 text-[11px] font-semibold text-ink-faint">{timeAgo(n.at)}</p>
                  </Wrapper>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
