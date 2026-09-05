"use client";

import { useCallback, useEffect, useState } from "react";
import type { Business, CategoryKey } from "@/lib/types";
import { fuzzyMatch } from "@/lib/fuzzyMatch";

const STORAGE_KEY = "kote-moris-suggestions";
const CHANGE_EVENT = "kote-moris-suggestions-change";

export type Suggestion = {
  id: string;
  nom: string;
  categorie: CategoryKey;
  submittedAt: string;
};

function readSuggestions(): Suggestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSuggestions(list: Suggestion[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Suggestions d'adresses envoyées par l'utilisateur (formulaire « Ajouter une
 * adresse »), stockées en local — pas de backend d'écriture, cf. AddAddressForm.
 * Sert uniquement à retrouver ce qu'on a proposé et à détecter, en comparant
 * au nom des fiches de l'annuaire, si une suggestion y ressemble déjà.
 */
export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => []);

  useEffect(() => {
    setSuggestions(readSuggestions());
    const onChange = () => setSuggestions(readSuggestions());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const addSuggestion = useCallback((nom: string, categorie: CategoryKey) => {
    const next = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, nom, categorie, submittedAt: new Date().toISOString() },
      ...readSuggestions(),
    ];
    writeSuggestions(next);
  }, []);

  const removeSuggestion = useCallback((id: string) => {
    writeSuggestions(readSuggestions().filter((s) => s.id !== id));
  }, []);

  return { suggestions, addSuggestion, removeSuggestion };
}

/**
 * Détection best-effort : cherche parmi les fiches existantes (même catégorie
 * en priorité) un nom qui correspond à la suggestion. Approximatif — sert
 * juste à donner un signal « probablement intégrée », pas une garantie.
 */
export function findIntegratedMatch(suggestion: Suggestion, businesses: Business[]): Business | null {
  const sameCategory = businesses.filter((b) => b.category === suggestion.categorie);
  const pool = sameCategory.length > 0 ? sameCategory : businesses;
  return pool.find((b) => fuzzyMatch(b.name, suggestion.nom)) ?? null;
}
