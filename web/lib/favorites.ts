"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kote-moris-favoris";
const CHANGE_EVENT = "kote-moris-favoris-change";

export type FavoriteStatus = "favori" | "a-tester";

function readFavorites(): Map<string, FavoriteStatus> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    // Ancien format : simple tableau d'ids, tous implicitement "favori".
    if (Array.isArray(parsed)) {
      return new Map(parsed.map((id: string) => [id, "favori" as const]));
    }
    return new Map(Object.entries(parsed) as [string, FavoriteStatus][]);
  } catch {
    return new Map();
  }
}

function writeFavorites(statuses: Map<string, FavoriteStatus>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(statuses)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Favoris de l'utilisateur (cœur activable sur une fiche), stockés en local —
 * pas de compte/backend pour l'instant, cf. lib/track.ts pour le même choix.
 * Chaque fiche a un statut : "favori" (coup de cœur) ou "a-tester" (à essayer),
 * les deux se retrouvent dans « Mes favoris ».
 */
export function useFavorites() {
  // Toujours vide au premier rendu (identique au serveur, qui n'a pas de
  // localStorage) — la vraie valeur arrive dans l'effet ci-dessous, après
  // l'hydratation, pour éviter un hydration mismatch.
  const [statuses, setStatuses] = useState<Map<string, FavoriteStatus>>(() => new Map());

  useEffect(() => {
    setStatuses(readFavorites());
    const onChange = () => setStatuses(readFavorites());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isFavorite = useCallback((id: string) => statuses.has(id), [statuses]);
  const getStatus = useCallback((id: string) => statuses.get(id), [statuses]);

  /** Bascule cœur classique (compat) : favori ↔ retiré. */
  const toggleFavorite = useCallback((id: string) => {
    const next = readFavorites();
    if (next.has(id)) next.delete(id);
    else next.set(id, "favori");
    writeFavorites(next);
  }, []);

  /** Fait tourner l'état sur un clic : vide → favori → à tester → vide. */
  const cycleStatus = useCallback((id: string) => {
    const next = readFavorites();
    const current = next.get(id);
    if (!current) next.set(id, "favori");
    else if (current === "favori") next.set(id, "a-tester");
    else next.delete(id);
    writeFavorites(next);
  }, []);

  return {
    favoriteIds: new Set(statuses.keys()),
    statuses,
    isFavorite,
    getStatus,
    toggleFavorite,
    cycleStatus,
  };
}
