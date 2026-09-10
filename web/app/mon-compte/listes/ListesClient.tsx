"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Trash, ShareNetwork, Check, CaretDown, CaretUp } from "@phosphor-icons/react";
import { useFavorites } from "@/lib/favorites";
import { getBusinesses } from "@/lib/data";
import type { Business } from "@/lib/types";
import { displayName } from "@/lib/format";
import { mapFavoriteListRow, type FavoriteList } from "@/lib/favoriteLists";
import { PREMIUM_PRICE_LABEL } from "@/lib/marketplace/constants";

const inputClass =
  "w-full h-[44px] px-4 rounded-xl border border-border bg-surface text-ink text-[14px] shadow-sm focus:outline-none focus:border-primary";

export function ListesClient({ isPremium }: { isPremium: boolean }) {
  const { favoriteIds } = useFavorites();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [lists, setLists] = useState<FavoriteList[] | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function loadLists() {
    fetch("/api/favorite-lists")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Record<string, unknown>[]) => setLists(rows.map(mapFavoriteListRow)));
  }

  useEffect(loadLists, []);
  useEffect(() => {
    getBusinesses().then(setBusinesses);
  }, []);

  const favoriteBusinesses = businesses.filter((b) => favoriteIds.has(b.id));

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);

    const res = await fetch("/api/favorite-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Une erreur est survenue.");
      setCreating(false);
      return;
    }

    setNewName("");
    setCreating(false);
    loadLists();
  }

  async function remove(id: number) {
    setLists((prev) => prev?.filter((l) => l.id !== id) ?? null);
    await fetch(`/api/favorite-lists/${id}`, { method: "DELETE" });
  }

  async function toggleBusiness(list: FavoriteList, businessId: string) {
    const inList = list.businessIds.includes(businessId);
    const body = inList ? { removeBusinessId: businessId } : { addBusinessId: businessId };

    // Mise à jour optimiste pour une interaction instantanée.
    setLists((prev) =>
      prev?.map((l) =>
        l.id === list.id
          ? {
              ...l,
              businessIds: inList
                ? l.businessIds.filter((id) => id !== businessId)
                : [...l.businessIds, businessId],
            }
          : l
      ) ?? null
    );

    await fetch(`/api/favorite-lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function toggleShare(list: FavoriteList) {
    const res = await fetch(`/api/favorite-lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shared: !list.shareToken }),
    });
    if (!res.ok) return;
    const { list: updated } = (await res.json()) as { list: Record<string, unknown> };
    const mapped = mapFavoriteListRow(updated);
    setLists((prev) => prev?.map((l) => (l.id === list.id ? mapped : l)) ?? null);

    if (mapped.shareToken) {
      await navigator.clipboard.writeText(`${window.location.origin}/liste/${mapped.shareToken}`);
      setCopiedId(list.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  }

  async function copyLink(list: FavoriteList) {
    if (!list.shareToken) return;
    await navigator.clipboard.writeText(`${window.location.origin}/liste/${list.shareToken}`);
    setCopiedId(list.id);
    setTimeout(() => setCopiedId(null), 2500);
  }

  if (!isPremium) {
    return (
      <div className="max-w-[480px] mx-auto px-4 pb-24 pt-6">
        <p className="font-serif text-xl font-semibold leading-tight mb-1">Mes listes</p>
        <p className="text-[13px] text-muted mb-4">
          Range tes favoris dans des listes nommées (« Restos à tester », « Sorties ce week-end »…) et
          partage-les par lien.
        </p>
        <Link
          href="/mon-compte/upgrade"
          className="flex items-center justify-between gap-3 bg-primary-tint border border-primary/20 rounded-xl p-3.5"
        >
          <span className="text-[13px] text-primary-deep font-medium">
            Passe premium ({PREMIUM_PRICE_LABEL}) pour créer des listes.
          </span>
          <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">S&apos;abonner</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-5">
      <div>
        <p className="font-serif text-xl font-semibold leading-tight">Mes listes</p>
        <p className="text-[13px] text-muted">
          Range tes favoris dans des listes nommées et partage-les par lien.
        </p>
      </div>

      {lists === null ? (
        <p className="text-center text-muted text-[13px]">Chargement…</p>
      ) : lists.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {lists.map((list) => {
            const listBusinesses = businesses.filter((b) => list.businessIds.includes(b.id));
            const expanded = expandedId === list.id;
            return (
              <div key={list.id} className="bg-surface border border-border rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : list.id)}
                    className="flex-1 min-w-0 flex items-center gap-2 text-left"
                  >
                    {expanded ? (
                      <CaretUp size={14} weight="bold" className="shrink-0 text-muted" aria-hidden />
                    ) : (
                      <CaretDown size={14} weight="bold" className="shrink-0 text-muted" aria-hidden />
                    )}
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold truncate">{list.name}</span>
                      <span className="block text-[11.5px] text-muted">
                        {list.businessIds.length} adresse{list.businessIds.length > 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => (list.shareToken ? copyLink(list) : toggleShare(list))}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      list.shareToken ? "bg-primary-tint text-primary-deep" : "text-muted hover:text-primary-deep"
                    }`}
                    aria-label={list.shareToken ? "Copier le lien de partage" : "Activer le partage"}
                    title={list.shareToken ? "Copier le lien" : "Activer le partage"}
                  >
                    {copiedId === list.id ? (
                      <Check size={16} weight="bold" aria-hidden />
                    ) : (
                      <ShareNetwork size={16} weight={list.shareToken ? "fill" : "regular"} aria-hidden />
                    )}
                  </button>
                  <button
                    onClick={() => remove(list.id)}
                    aria-label="Supprimer la liste"
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-600"
                  >
                    <Trash size={16} weight="bold" aria-hidden />
                  </button>
                </div>

                {list.shareToken && (
                  <p className="mt-2 text-[11.5px] text-primary-deep">
                    {copiedId === list.id ? "Lien copié !" : "Partagée — clique sur l'icône pour copier le lien."}
                  </p>
                )}

                {expanded && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5">
                    {favoriteBusinesses.length === 0 ? (
                      <p className="text-[12.5px] text-muted">
                        Ajoute d&apos;abord des fiches en favoris pour pouvoir les ranger ici.
                      </p>
                    ) : (
                      favoriteBusinesses.map((b) => {
                        const inList = list.businessIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className="flex items-center gap-2.5 text-[13px] py-1 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={inList}
                              onChange={() => toggleBusiness(list, b.id)}
                              className="shrink-0 w-4 h-4 accent-[var(--primary)]"
                            />
                            <span className="truncate">{displayName(b.name)}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {!expanded && listBusinesses.length > 0 && (
                  <p className="mt-1.5 text-[12px] text-muted truncate">
                    {listBusinesses.map((b) => displayName(b.name)).join(" · ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex. Restos à tester"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="shrink-0 h-[44px] px-4 rounded-xl font-semibold text-[13.5px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
        >
          Créer
        </button>
      </form>
      {error && <p className="text-[12.5px] text-red-600 text-center">{error}</p>}
    </div>
  );
}
