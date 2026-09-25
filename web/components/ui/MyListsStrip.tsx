"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { useFavoriteLists } from "@/lib/useFavoriteLists";

/**
 * Onglet Favoris : rangée horizontale des listes personnalisées de
 * l'utilisateur, avec un raccourci de création. Rien pour un visiteur non
 * connecté (le bandeau « Connecte-toi » de l'onglet s'en charge).
 */
export function MyListsStrip() {
  const { status, lists } = useFavoriteLists();
  if (status !== "ready") return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="m-0 text-[13px] font-bold text-ink">Mes listes</p>
        {lists.length > 0 && (
          <Link href="/mon-compte/listes" className="text-[12px] font-semibold text-primary-deep">
            Tout voir
          </Link>
        )}
      </div>
      <div className="flex gap-2.5 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/mon-compte/listes?id=${list.id}`}
            className="snap-start shrink-0 w-[150px] bg-surface border border-border rounded-2xl shadow-sm p-3 flex flex-col gap-1.5 no-underline text-ink"
          >
            <span className="w-9 h-9 rounded-xl bg-primary-tint flex items-center justify-center text-lg" aria-hidden>
              {list.emoji ?? "📍"}
            </span>
            <span className="text-[13.5px] font-semibold leading-tight line-clamp-2">{list.name}</span>
            <span className="text-[11.5px] text-muted truncate">
              {list.businessIds.length} adresse{list.businessIds.length > 1 ? "s" : ""}
              {list.period ? ` · ${list.period}` : ""}
            </span>
          </Link>
        ))}
        <Link
          href="/mon-compte/listes?new=1"
          className="snap-start shrink-0 w-[120px] border-2 border-dashed border-border rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 text-center text-muted no-underline"
        >
          <Plus size={20} weight="bold" aria-hidden />
          <span className="text-[12.5px] font-semibold">Nouvelle liste</span>
        </Link>
      </div>
    </section>
  );
}
