"use client";

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import EmptyState from "@/components/ui/EmptyState";
import { MessageCircle, MessagesSquare, UserRound } from "lucide-react";

export default function OwnerMessages() {
  const [convos, setConvos] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations/mine")
      .then((r) => r.json())
      .then((j) => {
        const list = j.data?.conversations || [];
        setConvos(list);
        setActive((current) => current || list[0] || null);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="mt-6 text-sm font-semibold text-ink-faint">Loading conversations...</p>;
  if (convos.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState icon="i" title="No conversations yet" hint="Buyer questions will appear here after they start a listing conversation." />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      <aside className="md:col-span-1">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
          <MessagesSquare className="h-4 w-4 text-brand" /> Conversations
        </div>
        <ul className="space-y-2">
          {convos.map((c) => {
            const selected = active && active.listingId === c.listingId && active.buyerId === c.buyerId;
            return (
              <li key={`${c.listingId}-${c.buyerId}`}>
                <button
                  onClick={() => setActive(c)}
                  className={`group w-full rounded-xl border p-3 text-left text-sm shadow-soft transition hover:-translate-y-0.5 ${
                    selected ? "border-brand bg-brand-50 text-brand" : "border-line bg-surface text-ink-soft hover:border-brand/35 hover:text-ink"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-brand text-white" : "bg-panel text-ink-faint group-hover:text-brand"}`}>
                      <UserRound className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-ink">{c.listingTitle}</span>
                      <span className="mt-0.5 block truncate text-xs">{c.buyerName} - {c.preview || "No message preview"}</span>
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="md:col-span-2">
        {active ? (
          <ChatBox listingId={active.listingId} side="owner" buyerId={active.buyerId} />
        ) : (
          <div className="card flex min-h-52 flex-col items-center justify-center text-center text-sm text-ink-faint">
            <MessageCircle className="mb-2 h-6 w-6 text-brand" />
            Select a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
