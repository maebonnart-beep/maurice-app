"use client";

import { Heart, Flag, CheckCircle } from "@phosphor-icons/react";
import { useFavorites } from "@/lib/favorites";
import { COUP_DE_COEUR_COLOR } from "./Badge";

// Couleur du drapeau en état « à tester » (distincte du rouge coup de cœur).
const A_TESTER_COLOR = "#f5a623";
// Couleur du check en état « testé » (distincte des deux autres).
export const TESTE_COLOR = "#2e9e5b";

/**
 * Trois boutons distincts et indépendants : cœur (coup de cœur), drapeau
 * (à tester) et check (testé) — formes différentes pour rester lisibles
 * même sans la couleur. Un re-clic sur le bouton actif retire la fiche
 * des favoris.
 */
export function FavoriteButton({
  id,
  size = 18,
  className = "",
  /** Style appliqué à chaque bouton (ex. pastille ronde sur une photo) ; par défaut, icône seule sans fond. */
  chipClassName = "inline-flex items-center justify-center",
}: {
  id: string;
  size?: number;
  className?: string;
  chipClassName?: string;
}) {
  const { getStatus, setStatus } = useFavorites();
  const status = getStatus(id);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStatus(id, "favori");
        }}
        aria-label={status === "favori" ? "Retirer des coups de cœur" : "Marquer coup de cœur"}
        aria-pressed={status === "favori"}
        className={`${chipClassName} active:scale-[.9] transition-transform`}
      >
        <Heart
          size={size}
          weight={status === "favori" ? "fill" : "regular"}
          style={{ color: status === "favori" ? COUP_DE_COEUR_COLOR : undefined }}
          aria-hidden
        />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStatus(id, "a-tester");
        }}
        aria-label={status === "a-tester" ? "Retirer de à tester" : "Marquer à tester"}
        aria-pressed={status === "a-tester"}
        className={`${chipClassName} active:scale-[.9] transition-transform`}
      >
        <Flag
          size={size}
          weight={status === "a-tester" ? "fill" : "regular"}
          style={{ color: status === "a-tester" ? A_TESTER_COLOR : undefined }}
          aria-hidden
        />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setStatus(id, "teste");
        }}
        aria-label={status === "teste" ? "Retirer de testé" : "Marquer comme testé"}
        aria-pressed={status === "teste"}
        className={`${chipClassName} active:scale-[.9] transition-transform`}
      >
        <CheckCircle
          size={size}
          weight={status === "teste" ? "fill" : "regular"}
          style={{ color: status === "teste" ? TESTE_COLOR : undefined }}
          aria-hidden
        />
      </button>
    </div>
  );
}
