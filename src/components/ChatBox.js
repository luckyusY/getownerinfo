"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared chat thread.
 * @param {string} listingId
 * @param {"buyer"|"owner"} side   - which side the current user is on
 * @param {string} [buyerId]       - required when side === "owner"
 */
export default function ChatBox({ listingId, side, buyerId }) {
  const [messages, setMessages] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const qs = side === "owner" && buyerId ? `?buyerId=${buyerId}` : "";

  const load = useCallback(async () => {
    const res = await fetch(`/api/conversations/${listingId}/messages${qs}`);
    const j = await res.json();
    if (j.success) {
      setMessages(j.data.messages || []);
      setUnlocked(!!j.data.unlocked);
    }
    setLoading(false);
  }, [listingId, qs]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setNotice("");
    try {
      const payload = { body: text };
      if (side === "owner") payload.buyerId = buyerId;
      const res = await fetch(`/api/conversations/${listingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.success) throw new Error(j.error);
      if (j.data.blocked) {
        setNotice(`⚠ Message blocked — it looked like it shared ${j.data.reasons.join(", ")}. Contact details can only be shared after the buyer unlocks.`);
      } else {
        setText("");
        await load();
      }
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-2">
        <span className="text-sm font-medium text-ink">Messages</span>
        <span className={`text-xs ${unlocked ? "text-emerald-600" : "text-amber-600"}`}>
          {unlocked ? "Contact sharing unlocked" : "Pre-unlock — contact info is blocked"}
        </span>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="text-sm text-ink-faint">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-ink-faint">No messages yet. Ask about availability.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderSide === side;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.blocked ? "border border-dashed border-red-300 bg-red-50 text-red-600"
                  : mine ? "bg-brand text-white" : "bg-panel text-ink"
                }`}>
                  {m.body}
                  {m.blocked && <span className="mt-1 block text-[11px]">Blocked ({m.blockedReasons.join(", ")}) — not delivered</span>}
                  {m.onBehalf && <span className="mt-1 block text-[11px] opacity-70">(sent by staff)</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {notice && <p className="mx-4 mb-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">{notice}</p>}

      <form onSubmit={send} className="flex gap-2 border-t border-line/70 p-3">
        <input
          className="input"
          placeholder={unlocked ? "Type a message…" : "Ask about availability (no contact info yet)"}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary" disabled={sending || !text.trim()}>{sending ? "…" : "Send"}</button>
      </form>
    </div>
  );
}
