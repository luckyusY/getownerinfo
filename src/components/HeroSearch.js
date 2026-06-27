"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
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
      className="mt-8 w-full max-w-3xl rounded-2xl border border-white/35 bg-white/96 p-2.5 shadow-[0_22px_55px_-24px_rgba(0,0,0,0.65)] ring-1 ring-ink/10 backdrop-blur"
    >
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_minmax(180px,1.35fr)_auto] lg:items-center">
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-panel/90 px-3">
          <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">Type</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none"
          >
            <option value="">All categories</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-panel/90 px-3">
          <MapPin className="h-4 w-4 shrink-0 text-brand" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none"
          >
            <option value="">All areas</option>
            {RWANDA_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </label>
        <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-soft">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Apartment, Toyota, plot..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
        <button type="submit" className="btn-primary min-h-12 px-6 text-base">Search</button>
      </div>
    </form>
  );
}
