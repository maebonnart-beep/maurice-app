"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createClient } from "./supabase/client";
import { FREE_LIST_LIMIT, mapFavoriteListRow, type FavoriteList, type ListInfo } from "./favoriteLists";

// ─── Store partagé côté client ────────────────────────────────────────────
// Un seul chargement pour toute l'app : la carte, la fiche détaillée, l'onglet
// Favoris et « Mes listes » lisent le même état et se mettent à jour ensemble.

type StoreState = {
  status: "idle" | "loading" | "anon" | "ready";
  lists: FavoriteList[];
  /** Premium, contributeur ou admin : pas de limite FREE_LIST_LIMIT. */
  unlimited: boolean;
  /**
   * « Mode ajout » : liste ouverte depuis sa page via « + Ajouter une adresse ».
   * Tant qu'il est actif, le bouton liste des fiches ajoute/retire directement
   * dans cette liste (sans feuille de choix), cf. AddToListButton/AddToListBanner.
   */
  targetListId: number | null;
};

const INITIAL_STATE: StoreState = { status: "idle", lists: [], unlimited: false, targetListId: null };
let state: StoreState = INITIAL_STATE;
const listeners = new Set<() => void>();

function setState(next: Partial<StoreState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function setLists(update: (lists: FavoriteList[]) => FavoriteList[]) {
  setState({ lists: update(state.lists) });
}

async function load() {
  setState({ status: "loading" });
  try {
    // Session lue en local (pas d'appel réseau) : évite un 401 inutile à
    // chaque visite d'un visiteur non connecté.
    const {
      data: { session },
    } = await createClient().auth.getSession();
    if (!session) {
      setState({ status: "anon", lists: [], unlimited: false });
      return;
    }
    const res = await fetch("/api/favorite-lists");
    if (!res.ok) {
      setState({ status: "anon", lists: [], unlimited: false });
      return;
    }
    const data = (await res.json()) as { lists: Record<string, unknown>[]; unlimited: boolean };
    setState({ status: "ready", lists: data.lists.map(mapFavoriteListRow), unlimited: data.unlimited });
  } catch {
    setState({ status: "anon", lists: [], unlimited: false });
  }
}

/** `apply: false` : garde l'état optimiste local au lieu de la réponse serveur. */
async function patch(id: number, body: Record<string, unknown>, apply = true): Promise<FavoriteList | null> {
  const res = await fetch(`/api/favorite-lists/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const { list } = (await res.json()) as { list: Record<string, unknown> };
  const mapped = mapFavoriteListRow(list);
  if (apply) setLists((lists) => lists.map((l) => (l.id === id ? mapped : l)));
  return mapped;
}

const actions = {
  refresh: load,

  setTargetList(id: number | null) {
    setState({ targetListId: id });
  },

  /** Crée une liste (et y ajoute éventuellement une fiche). Renvoie un message d'erreur ou null. */
  async create(info: ListInfo & { name: string }, addBusinessId?: string): Promise<string | null> {
    const res = await fetch("/api/favorite-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...info, addBusinessId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return json.error ?? "Une erreur est survenue.";
    const created = mapFavoriteListRow(json.list);
    setLists((lists) => [...lists, created]);
    return null;
  },

  update(id: number, info: ListInfo) {
    return patch(id, info);
  },

  toggleBusiness(list: FavoriteList, businessId: string) {
    const inList = list.businessIds.includes(businessId);
    // Mise à jour optimiste pour une interaction instantanée.
    setLists((lists) =>
      lists.map((l) =>
        l.id === list.id
          ? {
              ...l,
              businessIds: inList ? l.businessIds.filter((id) => id !== businessId) : [...l.businessIds, businessId],
            }
          : l
      )
    );
    return patch(list.id, inList ? { removeBusinessId: businessId } : { addBusinessId: businessId });
  },

  setNote(list: FavoriteList, businessId: string, note: string) {
    setLists((lists) =>
      lists.map((l) => {
        if (l.id !== list.id) return l;
        const notes = { ...l.notes };
        if (note.trim()) notes[businessId] = note.trim();
        else delete notes[businessId];
        return { ...l, notes };
      })
    );
    return patch(list.id, { setNote: { businessId, note } });
  },

  reorder(list: FavoriteList, businessIds: string[]) {
    setLists((lists) => lists.map((l) => (l.id === list.id ? { ...l, businessIds } : l)));
    // Clics rapides sur les flèches : une réponse arrivée en retard ne doit
    // pas ramener un ordre intermédiaire, l'état local fait foi.
    return patch(list.id, { order: businessIds }, false);
  },

  toggleShare(list: FavoriteList) {
    return patch(list.id, { shared: !list.shareToken });
  },

  async remove(id: number) {
    setLists((lists) => lists.filter((l) => l.id !== id));
    await fetch(`/api/favorite-lists/${id}`, { method: "DELETE" });
  },
};

/**
 * Listes personnalisées de l'utilisateur connecté (Supabase, table
 * favorite_lists). `status === "anon"` quand personne n'est connecté.
 */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFavoriteLists() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => INITIAL_STATE
  );

  useEffect(() => {
    if (state.status === "idle") load();
  }, []);

  const limitReached = !snapshot.unlimited && snapshot.lists.length >= FREE_LIST_LIMIT;

  return { ...snapshot, limitReached, ...actions };
}
