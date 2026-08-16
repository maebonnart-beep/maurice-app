"use client";

import { Heart } from "@phosphor-icons/react";
import { useFavorites } from "@/lib/favorites";
import { COUP_DE_COEUR_COLOR } from "./Badge";

// Couleur du cœur en état « à tester » (distincte du rouge coup de cœur).
const A_TESTER_COLOR = "#f5a623";

const LABELS = {
  none: "Ajouter aux favoris",
  favori: "Marquer à tester",
  "a-tester": "Retirer des favoris",
} as const;

/**
 * Cœur activable (favoris) : un clic fait tourner l'état — vide → favori
 * (rouge) → à tester (orange) → vide —, sans propager au conteneur (carte cliquable).
 */
export function FavoriteButton({
  id,
  size = 18,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const { getStatus, cycleStatus } = useFavorites();
  const status = getStatus(id);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        cycleStatus(id);
      }}
      aria-label={LABELS[status ?? "none"]}
      aria-pressed={!!status}
      className={`inline-flex items-center justify-center active:scale-[.9] transition-transform ${className}`}
    >
      <Heart
        size={size}
        weight={status ? "fill" : "regular"}
        style={{ color: status === "favori" ? COUP_DE_COEUR_COLOR : status === "a-tester" ? A_TESTER_COLOR : undefined }}
        aria-hidden
      />
    </button>
  );
}
