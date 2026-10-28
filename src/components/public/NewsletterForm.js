"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [message, setMessage] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not subscribe");
      setState("done");
      setEmail("");
      setMessage("You are on the list.");
    } catch (err) {
      setState("error");
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="newsletter-email">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="min-w-0 flex-1 rounded-lg border border-navy-line bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white outline-none transition placeholder:font-medium placeholder:text-white/40 focus:border-brand"
        />
        <button type="submit" disabled={state === "sending"} className="btn-primary !rounded-lg shrink-0">
          {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : null}
          {state === "done" ? "Subscribed" : "Subscribe"}
        </button>
      </div>
      {message && (
        <p role="status" className={`mt-2 text-xs font-bold ${state === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
