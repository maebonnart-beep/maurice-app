"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { useFavoriteLists } from "@/lib/useFavoriteLists";
import { ListCover } from "./ListCover";

/**
 * Bandeau du « mode ajout » : ouvert depuis la page d'une liste
 * (« + Ajouter une adresse » → /?addTo=<id>). Active la liste cible dans le
 * store (les boutons liste des fiches ajoutent alors directement dedans) et
 * propose « Terminé » pour revenir à la liste.
 */
export function AddToListBanner() {
  const router = useRouter();
  const { lists, targetListId, setTargetList } = useFavoriteLists();

  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("addTo"));
    if (Number.isFinite(id) && id > 0) setTargetList(id);
  }, [setTargetList]);

  const target = targetListId !== null ? lists.find((l) => l.id === targetListId) : undefined;
  if (!target) return null;

  function done() {
    const id = targetListId;
    setTargetList(null);
    router.push(`/mon-compte/listes?id=${id}`);
  }

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 z-40 w-[calc(100%-24px)] max-w-[480px]">
      <div className="flex items-center gap-3 rounded-2xl bg-primary text-on-primary shadow-pop px-3 py-2.5">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-surface flex items-center justify-center text-lg">
          <ListCover emoji={target.emoji} size={30} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold truncate">Ajout à « {target.name} »</span>
          <span className="block text-[11.5px] opacity-85">
            {target.businessIds.length} adresse{target.businessIds.length > 1 ? "s" : ""} · touche ＋ sur une fiche
          </span>
        </span>
        <button
          onClick={done}
          className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-surface text-primary-deep text-[13px] font-bold active:scale-[.97]"
        >
          <Check size={14} weight="bold" aria-hidden /> Terminé
        </button>
      </div>
    </div>
  );
}
