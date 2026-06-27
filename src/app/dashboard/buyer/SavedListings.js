"use client";

import { useEffect, useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import { ListingCardSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function SavedListings() {
  const [listings, setListings] = useState(null);

  useEffect(() => {
    fetch("/api/favorites/mine")
      .then((r) => r.json())
      .then((j) => setListings(j.data?.listings || []))
      .catch(() => setListings([]));
  }, []);

  if (listings === null) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <ListingCardSkeleton key={i} />)}
      </div>
    );
  }
  if (listings.length === 0) {
    return <EmptyState title="No saved listings" hint="Tap the heart on any listing to save it here for later." />;
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => <PropertyCard key={l.id} listing={l} />)}
    </div>
  );
}
