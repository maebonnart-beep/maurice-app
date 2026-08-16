"use client";

import { Heart } from "@phosphor-icons/react";
import { useFavorites } from "@/lib/favorites";
import { COUP_DE_COEUR_COLOR } from "./Badge";

/** Cœur activable (favoris) : bascule l'état au clic, sans propager au conteneur (carte cliquable). */
export function FavoriteButton({
  id,
  size = 18,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(id);
      }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center active:scale-[.9] transition-transform ${className}`}
    >
      <Heart
        size={size}
        weight={active ? "fill" : "regular"}
        style={{ color: active ? COUP_DE_COEUR_COLOR : undefined }}
        aria-hidden
      />
    </button>
  );
}
