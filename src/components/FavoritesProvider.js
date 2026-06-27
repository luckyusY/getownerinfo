"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);

export function useFavorites() {
  return useContext(Ctx) || { isFavorited: () => false, toggle: async () => ({ ok: false }) };
}

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((j) => { if (j.success) setIds(new Set(j.data.ids)); })
      .catch(() => {});
  }, []);

  const isFavorited = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(async (id) => {
    let added;
    setIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); added = false; } else { n.add(id); added = true; }
      return n;
    });
    try {
      const r = await fetch(`/api/favorites/${id}`, { method: "POST" });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || "Failed");
      setIds((prev) => {
        const n = new Set(prev);
        if (j.data.favorited) n.add(id); else n.delete(id);
        return n;
      });
      return { ok: true, favorited: j.data.favorited };
    } catch (e) {
      setIds((prev) => {
        const n = new Set(prev);
        if (added) n.delete(id); else n.add(id);
        return n;
      });
      return { ok: false, error: e.message };
    }
  }, []);

  return <Ctx.Provider value={{ isFavorited, toggle }}>{children}</Ctx.Provider>;
}
