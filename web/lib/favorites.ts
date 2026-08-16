"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kote-moris-favoris";
const CHANGE_EVENT = "kote-moris-favoris-change";

function readFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeFavorites(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Favoris de l'utilisateur (cœur activable sur une fiche), stockés en local —
 * pas de compte/backend pour l'instant, cf. lib/track.ts pour le même choix.
 */
export function useFavorites() {
  // Toujours vide au premier rendu (identique au serveur, qui n'a pas de
  // localStorage) — la vraie valeur arrive dans l'effet ci-dessous, après
  // l'hydratation, pour éviter un hydration mismatch.
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIds(readFavorites());
    const onChange = () => setIds(readFavorites());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isFavorite = useCallback((id: string) => ids.has(id), [ids]);

  const toggleFavorite = useCallback((id: string) => {
    const next = readFavorites();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeFavorites(next);
  }, []);

  return { favoriteIds: ids, isFavorite, toggleFavorite };
}
