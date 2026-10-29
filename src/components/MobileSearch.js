"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function MobileSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e) {
    e.preventDefault();
    const query = q.trim();
    router.push(`/listings${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="flex h-11 items-center gap-2 rounded-full border border-line bg-panel pl-3.5 pr-0 shadow-sm focus-within:border-brand focus-within:bg-white"
    >
      <Search className="h-4 w-4 shrink-0 text-brand" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search listings"
        placeholder="Search"
        type="search"
        enterKeyHint="search"
        className="min-w-0 flex-1 self-stretch bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
      />
      <button type="submit" className="h-11 shrink-0 rounded-full bg-brand px-3.5 text-xs font-black uppercase tracking-wide text-white transition active:scale-95">
        Go
      </button>
    </form>
  );
}
