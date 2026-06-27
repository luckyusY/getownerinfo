"use client";

import { useEffect, useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { BadgeCheck, Filter, RotateCcw, Search, SlidersHorizontal, Sparkles } from "lucide-react";

export default function ListingsExplorer({ initialCategory = "" }) {
  const [cats, setCats] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(initialCategory);
  const [txn, setTxn] = useState("all");
  const [model, setModel] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    fetch("/api/catalog").then((r) => r.json()).then((j) => {
      const list = j.data?.categories || [];
      setCats(list);
      setCatMap(Object.fromEntries(list.map((c) => [c.id, c.name])));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (model !== "all") qs.set("model", model);
    if (q.trim()) qs.set("q", q.trim());
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/listings?${qs}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => { setListings(j.data?.listings || []); setLoading(false); })
        .catch(() => {});
    }, q ? 250 : 0);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [category, model, q]);

  const visible = useMemo(() => {
    const min = Number(priceMin) || 0;
    const max = Number(priceMax) || Infinity;
    const filtered = listings.filter(
      (l) => (txn === "all" || l.transactionType === txn) && l.price >= min && l.price <= max
    );
    const sorted = [...filtered];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    return sorted; // "new" keeps API order (newest first)
  }, [listings, txn, priceMin, priceMax, sort]);

  const activeCount = [category, txn !== "all" ? txn : "", model !== "all" ? model : "", q.trim(), priceMin, priceMax].filter(Boolean).length;
  const activeCategory = cats.find((c) => c.slug === category)?.name;

  function resetFilters() {
    setCategory("");
    setTxn("all");
    setModel("all");
    setQ("");
    setPriceMin("");
    setPriceMax("");
    setSort("new");
  }

  return (
    <div>
      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-y border-line/70 bg-paper/92 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl rounded-xl border border-line bg-surface/94 p-3 shadow-soft">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="input-wrap min-w-0 flex-1 lg:max-w-md">
              <Search className="h-4 w-4 shrink-0 text-ink-faint" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
                placeholder="Search by title, area, or asset"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="hidden items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-ink-faint sm:inline-flex">
                <Filter className="h-3.5 w-3.5" /> Deal
              </span>
              <button className="chip" data-active={txn === "all"} onClick={() => setTxn("all")}>All</button>
              <button className="chip" data-active={txn === "rent"} onClick={() => setTxn("rent")}>Rent</button>
              <button className="chip" data-active={txn === "sale"} onClick={() => setTxn("sale")}>Buy</button>
              <span className="mx-1 hidden h-6 w-px self-center bg-line sm:block" />
              <span className="hidden items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wide text-ink-faint sm:inline-flex">
                <BadgeCheck className="h-3.5 w-3.5" /> Trust
              </span>
              <button className="chip" data-active={model === "all"} onClick={() => setModel("all")}>Any</button>
              <button className="chip" data-active={model === "A"} onClick={() => setModel("A")}>Exclusive</button>
              <button className="chip" data-active={model === "B"} onClick={() => setModel("B")}>Standard</button>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button className="chip" data-active={category === ""} onClick={() => setCategory("")}>All categories</button>
            {cats.map((c) => (
              <button key={c.slug} className="chip shrink-0" data-active={category === c.slug} onClick={() => setCategory(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="?"
          title="No listings match"
          hint="Try clearing a filter, using a broader category, or searching a different term."
          action={<button className="btn-outline" onClick={resetFilters}><RotateCcw className="h-4 w-4" /> Reset filters</button>}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 text-brand" />
                {visible.length} verified listing{visible.length === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-faint">
                {activeCount ? `Filtered by ${[activeCategory, txn !== "all" ? txn : "", model !== "all" ? `Model ${model}` : "", q.trim() && `"${q.trim()}"`].filter(Boolean).join(", ")}` : "Showing the newest active listings first"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="number" inputMode="numeric" placeholder="Min Rwf" value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-24 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
                  aria-label="Minimum price"
                />
                <span className="text-ink-faint">–</span>
                <input
                  type="number" inputMode="numeric" placeholder="Max Rwf" value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-24 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
                  aria-label="Maximum price"
                />
              </div>
              <select
                value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort listings"
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm font-semibold text-ink outline-none focus:border-brand"
              >
                <option value="new">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
              <button className="btn-outline min-h-9 px-3 py-1.5" onClick={resetFilters} disabled={!activeCount}>
                <SlidersHorizontal className="h-4 w-4" /> Clear
              </button>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((l, i) => (
              <PropertyCard
                key={l.id}
                listing={{ ...l, categoryName: catMap[l.category] || "Listing" }}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
