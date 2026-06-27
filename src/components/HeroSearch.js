"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RWANDA_LOCATIONS } from "@/data/locations";

export default function HeroSearch() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => setCats(j.data?.categories || []));
  }, []);

  function search(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/listings${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={search}
      className="mt-8 flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-white/20 bg-white p-2 shadow-lift sm:flex-row sm:items-center"
    >
      <div className="grid gap-2 sm:grid-cols-[0.9fr_0.9fr]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border-0 bg-panel px-3 py-2.5 text-sm font-semibold text-ink outline-none"
        >
          <option value="">All categories</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border-0 bg-panel px-3 py-2.5 text-sm font-semibold text-ink outline-none"
        >
          <option value="">All areas</option>
          {RWANDA_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by title, e.g. apartment, Toyota"
        className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
      />
      <button type="submit" className="btn-primary px-6 py-2.5">Search</button>
    </form>
  );
}
