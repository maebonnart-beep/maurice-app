"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryKey } from "@/lib/types";

const STORAGE_KEY = "kote-moris-preferences";
export const PREFERENCES_CHANGE_EVENT = "kote-moris-preferences-change";

export type Preferences = {
  /** Rubriques cochées explicitement par l'utilisateur, mises en avant sur l'accueil. */
  interests: CategoryKey[];
  /** Coche "j'ai des enfants" : booste "famille-travail" sans que l'utilisateur ait à la sélectionner lui-même. */
  hasKids: boolean;
};

const EMPTY_PREFERENCES: Preferences = { interests: [], hasKids: false };

/** Lecture directe du localStorage, hors React — utilisée par la sync distante (lib/preferencesSync.ts). */
export function readPreferences(): Preferences {
  if (typeof window === "undefined") return EMPTY_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
      hasKids: parsed.hasKids === true,
    };
  } catch {
    return EMPTY_PREFERENCES;
  }
}

function writePreferences(prefs: Preferences) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(PREFERENCES_CHANGE_EVENT));
}

/**
 * Préférences de personnalisation de l'accueil (rubriques d'intérêt + enfants),
 * réglables dans l'onglet Profil. Stockées en local, synchronisées vers Supabase
 * pour les utilisateurs connectés (cf. lib/preferencesSync.ts) — même principe
 * que lib/favorites.ts.
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => EMPTY_PREFERENCES);

  useEffect(() => {
    setPreferences(readPreferences());
    const onChange = () => setPreferences(readPreferences());
    window.addEventListener(PREFERENCES_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PREFERENCES_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggleInterest = useCallback((key: CategoryKey) => {
    const current = readPreferences();
    const next = current.interests.includes(key)
      ? current.interests.filter((k) => k !== key)
      : [...current.interests, key];
    writePreferences({ ...current, interests: next });
  }, []);

  const setHasKids = useCallback((value: boolean) => {
    writePreferences({ ...readPreferences(), hasKids: value });
  }, []);

  /** Fusionne une sauvegarde distante : union des intérêts, OR sur hasKids. */
  const mergePreferences = useCallback((imported: Partial<Preferences>) => {
    const current = readPreferences();
    const importedInterests = Array.isArray(imported.interests) ? imported.interests : [];
    writePreferences({
      interests: [...new Set([...current.interests, ...importedInterests])],
      hasKids: current.hasKids || imported.hasKids === true,
    });
  }, []);

  return { preferences, toggleInterest, setHasKids, mergePreferences };
}
