"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kote-moris-listes-favorites";
export const FAVORITE_SELECTIONS_CHANGE_EVENT = "kote-moris-listes-favorites-change";
const CHANGE_EVENT = FAVORITE_SELECTIONS_CHANGE_EVENT;

/** Lecture directe du localStorage, hors React — cf. readFavorites dans lib/favorites.ts. */
export function readFavoriteSelections(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed as string[]);
  } catch {
    return new Set();
  }
}

function writeFavoriteSelections(ids: Set<string>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Sélections (listes éditoriales Koté Moris) mises en favori par l'utilisateur,
 * stockées en local — même choix que lib/favorites.ts pour les fiches.
 */
export function useFavoriteSelections() {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setIds(readFavoriteSelections());
    const onChange = () => setIds(readFavoriteSelections());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isFavoriteSelection = useCallback((id: string) => ids.has(id), [ids]);

  const toggleFavoriteSelection = useCallback((id: string) => {
    const next = readFavoriteSelections();
    if (next.has(id)) next.delete(id);
    else next.add(id);
    writeFavoriteSelections(next);
  }, []);

  /** Fusionne une liste importée (sync distante ou sauvegarde) par union avec l'existant. */
  const mergeFavoriteSelections = useCallback((imported: string[]) => {
    const next = readFavoriteSelections();
    for (const id of imported) next.add(id);
    writeFavoriteSelections(next);
  }, []);

  return {
    favoriteSelectionIds: ids,
    isFavoriteSelection,
    toggleFavoriteSelection,
    mergeFavoriteSelections,
  };
}
