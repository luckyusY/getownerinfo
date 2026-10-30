"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { BadgeCheck, Filter, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, Tag } from "lucide-react";
import { RWANDA_LOCATIONS } from "@/data/locations";
import {
  ChipRow, DEAL_OPTIONS, FilterSheet, PriceRange, SelectField, SortSelect, TRUST_OPTIONS,
} from "./FilterControls";

export default function ListingsExplorer({
  initialCategory = "",
  initialLocation = "",
  initialQuery = "",
  initialCategories = null,
}) {
  const [cats, setCats] = useState(initialCategories || []);
  const [catMap, setCatMap] = useState(() =>
    Object.fromEntries((initialCategories || []).map((c) => [c.id, c.name]))
  );
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(initialLocation);
  const [txn, setTxn] = useState("all");
  const [model, setModel] = useState("all");
  const [q, setQ] = useState(initialQuery);
  const [sort, setSort] = useState("new");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Only when the server could not supply it — see listings/page.js. Kept as a
  // fallback rather than removed so a database blip degrades to the old
  // behaviour instead of leaving the filters permanently empty.
  useEffect(() => {
    if (initialCategories) return;
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((j) => {
        const list = j.data?.categories || [];
        setCats(list);
        setCatMap(Object.fromEntries(list.map((c) => [c.id, c.name])));
      })
      .catch(() => {
        /* filters stay empty; the listing grid does not depend on this */
      });
  }, [initialCategories]);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set("category", category);
    if (location) qs.set("location", location);
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
  }, [category, location, model, q]);

  // The sheet sits over the page, so stop the page behind it scrolling.
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

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

  const activeCount = [category, location, txn !== "all" ? txn : "", model !== "all" ? model : "", q.trim(), priceMin, priceMax].filter(Boolean).length;
  const activeCategory = cats.find((c) => c.slug === category)?.name;

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...cats.map((c) => ({ value: c.slug, label: c.name })),
  ];
  const locationOptions = [
    { value: "", label: "All areas" },
    ...RWANDA_LOCATIONS.map((loc) => ({ value: loc, label: loc })),
  ];

  function resetFilters() {
    setCategory("");
    setLocation("");
    setTxn("all");
    setModel("all");
    setQ("");
    setPriceMin("");
    setPriceMax("");
    setSort("new");
  }

  const searchField = (
    <label className="input-wrap min-w-0 flex-1 lg:max-w-md">
      <Search className="h-4 w-4 shrink-0 text-ink-faint" />
      <input
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-ink-faint"
        placeholder="Search by title, area, or asset"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </label>
  );

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 mb-6 border-y border-line/70 bg-paper/92 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-7xl rounded-xl border border-line bg-surface/94 p-3 shadow-soft">
          {/*
            Phones get one row: search, and a button into the sheet. The four
            stacked rows below used to take most of the screen before a single
            listing appeared.
          */}
          <div className="flex items-center gap-2 lg:hidden">
            {searchField}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-expanded={sheetOpen}
              className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-bold text-ink-soft transition active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-black text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {/*
            One control row, then categories. Deal and trust are short enough to
            sit inline; area is a select because 16 chips overflowed the bar and
            put a scrollbar across it. The whole bar was a quarter of the screen
            before any listing showed.
          */}
          <div className="hidden lg:block">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {searchField}
              <ChipRow icon={Filter} label="Deal" options={DEAL_OPTIONS} value={txn} onChange={setTxn} inline />
              <span className="h-6 w-px bg-line" />
              <ChipRow icon={BadgeCheck} label="Trust" options={TRUST_OPTIONS} value={model} onChange={setModel} inline />
              <span className="h-6 w-px bg-line" />
              <SelectField icon={MapPin} label="Area" value={location} onChange={setLocation} options={locationOptions} />
            </div>

            <div className="mt-2.5 border-t border-line/70 pt-2.5">
              <ChipRow options={categoryOptions} value={category} onChange={setCategory} />
            </div>
          </div>
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onReset={resetFilters}
        activeCount={activeCount}
        resultCount={visible.length}
        loading={loading}
      >
        <ChipRow icon={Filter} label="Deal" options={DEAL_OPTIONS} value={txn} onChange={setTxn} />
        <ChipRow icon={BadgeCheck} label="Trust" options={TRUST_OPTIONS} value={model} onChange={setModel} />
        <ChipRow icon={Tag} label="Category" options={categoryOptions} value={category} onChange={setCategory} />
        <ChipRow icon={MapPin} label="Area" options={locationOptions} value={location} onChange={setLocation} />
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">Price</p>
          <PriceRange min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">Sort</p>
          <SortSelect value={sort} onChange={setSort} className="w-full" />
        </div>
      </FilterSheet>

      {/*
        The results bar stays outside the empty-state branch. Price and sort
        used to live inside it, so filtering down to no results hid the very
        inputs needed to widen the range again.
      */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-ink">
            <Sparkles className="h-4 w-4 text-brand" />
            {visible.length} listing{visible.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-faint">
            {activeCount
              ? `Filtered by ${[activeCategory, location, txn !== "all" ? txn : "", model !== "all" ? `Model ${model}` : "", q.trim() && `"${q.trim()}"`].filter(Boolean).join(", ")}`
              : "Showing the newest active listings first"}
          </p>
        </div>

        {/* Price and sort are in the sheet on a phone, so this row is lg-only. */}
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <PriceRange min={priceMin} max={priceMax} onMin={setPriceMin} onMax={setPriceMax} />
          <SortSelect value={sort} onChange={setSort} />
          <button className="btn-outline min-h-9 px-3 py-1.5" onClick={resetFilters} disabled={!activeCount}>
            <SlidersHorizontal className="h-4 w-4" /> Clear
          </button>
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
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button className="btn-outline" onClick={resetFilters}><RotateCcw className="h-4 w-4" /> Reset filters</button>
              <button className="btn-outline lg:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Edit filters
              </button>
              <Link href="/seekers/new" className="btn-primary">Post what you need</Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((l, i) => (
            <PropertyCard
              key={l.id}
              listing={{ ...l, categoryName: catMap[l.category] || "Listing" }}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
