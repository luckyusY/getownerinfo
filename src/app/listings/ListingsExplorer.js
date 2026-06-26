"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatRwf } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function ListingsExplorer({ initialCategory = "" }) {
  const [cats, setCats] = useState([]);
  const [catMap, setCatMap] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(initialCategory);
  const [txn, setTxn] = useState("all"); // all | rent | sale
  const [model, setModel] = useState("all"); // all | A | B
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
    }, q ? 250 : 0); // debounce search
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [category, model, q]);

  const visible = useMemo(
    () => listings.filter((l) => txn === "all" || l.transactionType === txn),
    [listings, txn]
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-[57px] z-30 -mx-4 mb-6 border-y border-line/70 bg-paper/85 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input max-w-xs"
            placeholder="Search listings…"
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

        {/* Category chips */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button className="chip" data-active={category === ""} onClick={() => setCategory("")}>All categories</button>
          {cats.map((c) => (
            <button key={c.slug} className="chip" data-active={category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No listings match"
          hint="Try clearing a filter or searching a different term."
          action={<button className="btn-outline" onClick={() => { setCategory(""); setTxn("all"); setModel("all"); setQ(""); }}>Reset filters</button>}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-soft">{visible.length} listing{visible.length === 1 ? "" : "s"}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((l, i) => (
              <Link
                key={l.id}
                href={`/listings/${l.id}`}
                className="card group !p-3 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-panel">
                  {l.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.images[0]} alt={l.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-ink-faint">No image</div>
                  )}
                  <div className="absolute left-2 top-2 flex gap-1.5">
                    <Badge tone={l.transactionType === "rent" ? "info" : "gold"}>
                      {l.transactionType === "rent" ? "For rent" : "For sale"}
                    </Badge>
                    {l.model === "A" && <Badge tone="brand">Exclusive</Badge>}
                  </div>
                </div>
                <p className="px-1 text-xs font-medium text-ink-faint">{catMap[l.category] || "Listing"}</p>
                <h3 className="mt-0.5 px-1 font-display text-lg font-semibold leading-snug text-ink line-clamp-1">{l.title}</h3>
                <p className="px-1 text-sm text-ink-soft">📍 {l.location?.area || "Location on unlock"}</p>
                <p className="mt-1.5 px-1 pb-1 font-display text-xl font-semibold text-brand">{formatRwf(l.price)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
