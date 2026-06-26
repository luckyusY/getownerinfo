"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";

export default function OwnerMessages() {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations/mine")
      .then((r) => r.json())
      .then((j) => {
        setConvos(j.data?.conversations || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="mt-6 text-sm text-slate-500">Loading…</p>;
  if (convos.length === 0)
    return <div className="mt-6 card text-center text-sm text-slate-500">No conversations yet.</div>;

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      <ul className="space-y-2 md:col-span-1">
        {convos.map((c) => (
          <li key={`${c.listingId}-${c.buyerId}`}>
            <button
              onClick={() => setActive(c)}
              className={`w-full rounded-lg border p-3 text-left text-sm ${
                active && active.listingId === c.listingId && active.buyerId === c.buyerId
                  ? "border-brand bg-brand/5"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="font-medium text-slate-900">{c.listingTitle}</p>
              <p className="text-xs text-slate-500">{c.buyerName} · {c.preview || "—"}</p>
            </button>
          </li>
        ))}
      </ul>

      <div className="md:col-span-2">
        {active ? (
          <ChatBox listingId={active.listingId} side="owner" buyerId={active.buyerId} />
        ) : (
          <div className="card text-center text-sm text-slate-500">Select a conversation.</div>
        )}
      </div>
    </div>
  );
}
