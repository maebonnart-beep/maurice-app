"use client";

import { useEffect, useRef } from "react";
import { readPreferences, PREFERENCES_CHANGE_EVENT, type Preferences } from "./preferences";

const PUSH_DEBOUNCE_MS = 1500;

/** Synchronise les préférences (rubriques d'intérêt + enfants) vers Supabase
 * pour tout utilisateur connecté, en plus du localStorage qui reste la seule
 * source pour les visiteurs non connectés. Même principe que lib/favoritesSync.ts. */
export function usePreferencesSync(loggedIn: boolean, mergePreferences: (imported: Partial<Preferences>) => void) {
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
        const res = await fetch("/api/preferences");
        if (res.ok && !cancelled) {
          const data = (await res.json()) as Partial<Preferences>;
          mergePreferences(data);
        }
      } finally {
        if (!cancelled) pulledRef.current = true;
      }
      if (!cancelled) push();
    }

    function push() {
      if (!pulledRef.current) return;
      fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readPreferences()),
      }).catch(() => {});
    }

    function schedulePush() {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(push, PUSH_DEBOUNCE_MS);
    }

    pullThenPush();
    window.addEventListener(PREFERENCES_CHANGE_EVENT, schedulePush);
    return () => {
      cancelled = true;
      if (pushTimer.current) clearTimeout(pushTimer.current);
      window.removeEventListener(PREFERENCES_CHANGE_EVENT, schedulePush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mergePreferences est stable (useCallback, deps figées)
  }, [loggedIn]);
}
