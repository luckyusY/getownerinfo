"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck, Banknote, Bell, CheckCheck, CircleAlert, KeyRound, MessageSquareText,
} from "lucide-react";

const TYPE_STYLE = {
  listing_approved: { icon: BadgeCheck, tone: "bg-emerald-50 text-emerald-600" },
  listing_rejected: { icon: CircleAlert, tone: "bg-red-50 text-red-600" },
  unlock: { icon: KeyRound, tone: "bg-amber-50 text-amber-600" },
  message: { icon: MessageSquareText, tone: "bg-brand-50 text-brand" },
  commission: { icon: Banknote, tone: "bg-violet-50 text-violet-600" },
  penalty: { icon: CircleAlert, tone: "bg-red-50 text-red-600" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationList({ notifications: initial = [] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const unread = items.filter((n) => !n.read).length;

  async function markRead(id) {
    setItems((xs) => xs.map((x) => (id ? (x.id === id ? { ...x, read: true } : x) : { ...x, read: true })));
    setBusy(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { all: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-bold text-ink">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 && (
          <button type="button" onClick={() => markRead(null)} disabled={busy} className="btn-outline !py-1 !text-xs">
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      <ul className="divide-y divide-line">
        {items.map((n) => {
          const style = TYPE_STYLE[n.type] || { icon: Bell, tone: "bg-panel text-ink-soft" };
          const Icon = style.icon;
          const Row = n.link ? Link : "div";
          return (
            <li key={n.id} className={n.read ? "" : "bg-brand-50/40"}>
              <Row
                {...(n.link ? { href: n.link, onClick: () => !n.read && markRead(n.id) } : {})}
                className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-paper"
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.tone}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-ink">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Unread" />}
                    <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-ink-faint">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {n.body && <span className="mt-0.5 block text-xs font-semibold text-ink-soft">{n.body}</span>}
                </span>
              </Row>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
