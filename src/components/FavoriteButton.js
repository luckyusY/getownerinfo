"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";
import { useToast } from "@/components/ui/Toast";

/**
 * @param {string} listingId
 * @param {"icon"|"button"} variant
 */
export default function FavoriteButton({ listingId, variant = "icon" }) {
  const { isFavorited, toggle } = useFavorites();
  const { toast } = useToast();
  const fav = isFavorited(listingId);

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggle(listingId);
    if (!res.ok) {
      toast(res.error === "Authentication required" ? "Log in to save listings" : res.error, { type: "error" });
    } else {
      toast(res.favorited ? "Saved to favorites" : "Removed from favorites", { type: res.favorited ? "success" : "info" });
    }
  }

  if (variant === "button") {
    return (
      <button onClick={onClick} className="btn-outline" aria-pressed={fav} aria-label={fav ? "Saved" : "Save listing"}>
        <Heart className={`h-4 w-4 ${fav ? "fill-red-500 text-red-500" : ""}`} />
        {fav ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favorites" : "Save to favorites"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/90 shadow-soft backdrop-blur transition hover:scale-110"
    >
      <Heart className={`h-4 w-4 transition ${fav ? "fill-red-500 text-red-500" : "text-ink-soft"}`} />
    </button>
  );
}
