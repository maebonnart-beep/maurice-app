"use client";

import { useEffect, useRef } from "react";
import { readFavorites, FAVORITES_CHANGE_EVENT, type FavoriteStatus } from "./favorites";
import { readFavoriteSelections, FAVORITE_SELECTIONS_CHANGE_EVENT } from "./favoriteSelections";

const PUSH_DEBOUNCE_MS = 1500;

/** Synchronise favoris + sélections KM favorites vers Supabase pour tout
 * utilisateur connecté, en plus du localStorage qui reste la seule source
 * pour les visiteurs non connectés. Purement additif : ne remplace pas
 * useFavorites()/useFavoriteSelections(), tourne en tâche de fond à côté.
 *
 * - Au login : récupère la sauvegarde distante et la fusionne par union dans
 *   le localStorage (jamais d'écrasement, cf. import de sauvegarde manuelle).
 * - À chaque changement local : renvoie l'état local complet, avec un debounce
 *   pour éviter un appel réseau par clic.
 */
export function useFavoritesSync(
  loggedIn: boolean,
  mergeStatuses: (imported: Record<string, FavoriteStatus>) => number,
  mergeFavoriteSelections: (imported: string[]) => void
) {
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulledRef = useRef(false);

  useEffect(() => {
    if (!loggedIn) {
      pulledRef.current = false;
      return;
    }

    let cancelled = false;

    async function pullThenPush() {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { statuses: Record<string, FavoriteStatus>; selectionIds: string[] };
          mergeStatuses(data.statuses);
          mergeFavoriteSelections(data.selectionIds);
        }
      } finally {
        if (!cancelled) pulledRef.current = true;
      }
      if (!cancelled) push();
    }

    function push() {
      if (!pulledRef.current) return; // ne pousse jamais avant d'avoir fusionné le distant, sinon on écraserait avec un état local incomplet
      fetch("/api/favorites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statuses: Object.fromEntries(readFavorites()),
          selectionIds: [...readFavoriteSelections()],
        }),
      }).catch(() => {});
    }

    function schedulePush() {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(push, PUSH_DEBOUNCE_MS);
    }

    pullThenPush();
    window.addEventListener(FAVORITES_CHANGE_EVENT, schedulePush);
    window.addEventListener(FAVORITE_SELECTIONS_CHANGE_EVENT, schedulePush);
    return () => {
      cancelled = true;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      window.removeEventListener(FAVORITES_CHANGE_EVENT, schedulePush);
      window.removeEventListener(FAVORITE_SELECTIONS_CHANGE_EVENT, schedulePush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mergeStatuses/mergeFavoriteSelections sont stables (useCallback, deps figées)
  }, [loggedIn]);
}
