"use client";

import { useEffect, useMemo, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function ListingsExplorer({ initialCategory = "" }) {
  const [cats, setCats] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(initialCategory);
  const [txn, setTxn] = useState("all");
  const [model, setModel] = useState("all");
  const [q, setQ] = useState("");

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

  const visible = useMemo(
    () => listings.filter((l) => txn === "all" || l.transactionType === txn),
    [listings, txn]
  );

  function resetFilters() {
    setCategory("");
    setTxn("all");
    setModel("all");
    setQ("");
  }

  return (
    <div>
      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-y border-line/70 bg-paper/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input max-w-sm"
              placeholder="Search listings"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              <button className="chip" data-active={txn === "all"} onClick={() => setTxn("all")}>All</button>
              <button className="chip" data-active={txn === "rent"} onClick={() => setTxn("rent")}>For rent</button>
              <button className="chip" data-active={txn === "sale"} onClick={() => setTxn("sale")}>For sale</button>
              <span className="mx-1 h-6 w-px self-center bg-line" />
              <button className="chip" data-active={model === "all"} onClick={() => setModel("all")}>Any model</button>
              <button className="chip" data-active={model === "A"} onClick={() => setModel("A")}>Exclusive</button>
              <button className="chip" data-active={model === "B"} onClick={() => setModel("B")}>Standard</button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button className="chip" data-active={category === ""} onClick={() => setCategory("")}>All categories</button>
            {cats.map((c) => (
              <button key={c.slug} className="chip" data-active={category === c.slug} onClick={() => setCategory(c.slug)}>
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
          icon="0"
          title="No listings match"
          hint="Try clearing a filter or searching a different term."
          action={<button className="btn-outline" onClick={resetFilters}>Reset filters</button>}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-soft">{visible.length} listing{visible.length === 1 ? "" : "s"}</p>
            <button className="text-sm font-bold text-brand hover:text-brand-dark" onClick={resetFilters}>Clear filters</button>
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
