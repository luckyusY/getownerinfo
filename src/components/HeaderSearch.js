"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { RWANDA_LOCATIONS } from "@/data/locations";

export default function HeaderSearch() {
  const router = useRouter();
  const [cats, setCats] = useState([]);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => setCats(j.data?.categories || []));
  }, []);

  function submit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/listings${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={submit} className="hidden min-w-0 flex-1 lg:block">
      <div className="mx-auto flex h-10 max-w-xl items-center overflow-hidden rounded-full border border-line bg-panel/80 transition focus-within:border-brand focus-within:bg-white focus-within:shadow-soft">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="h-full w-36 shrink-0 bg-transparent pl-3 text-xs font-bold text-ink outline-none"
        >
          <option value="">All types</option>
          {cats.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
        </select>
        <span className="h-4 w-px shrink-0 bg-line" />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
          className="h-full w-32 shrink-0 bg-transparent pl-3 text-xs font-bold text-ink outline-none"
        >
          <option value="">All areas</option>
          {RWANDA_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <span className="h-4 w-px shrink-0 bg-line" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search listings"
          placeholder="Search listings"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
        />
        <button type="submit" aria-label="Search" className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark">
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
