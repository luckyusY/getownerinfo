"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => setCats(j.data?.categories || []));
  }, []);

  function search(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/listings${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={search}
      className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-soft sm:flex-row sm:items-center"
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-xl border-0 bg-panel px-3 py-2.5 text-sm font-semibold text-ink outline-none sm:w-44"
      >
        <option value="">All categories</option>
        {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by title, e.g. apartment, Toyota…"
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
      />
      <button type="submit" className="btn-primary px-6 py-2.5">Search</button>
    </form>
  );
}
