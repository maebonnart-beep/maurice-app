import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey } from "@/lib/icons";

// Couleurs d'accent des badges spéciaux — partagées avec l'accent latéral des fiches.
export const COUP_DE_COEUR_COLOR = "#ff2d6a";
export const SELECTION_COLOR = "#7c3aed";
export const AGENCY_COLOR = "#6366f1";

/** Badge de catégorie : pastille pleine colorée à la couleur de la catégorie. */
export function CategoryBadge({ category }: { category: CategoryKey }) {
  const cat = CATEGORY_MAP[category];
  const Icon = iconForKey(category);
  return (
    <span
      className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-white text-xs font-bold"
      style={{ background: cat.color }}
    >
      {Icon ? <Icon size={13} weight="bold" aria-hidden /> : cat.emoji} {cat.label}
    </span>
  );
}

export type SpecialBadgeVariant = "partenaire" | "coup-de-coeur" | "selection" | "agence";

/** Badges de mise en avant (Partenaire, Coup de cœur, Sélection, Agence organisatrice). */
export function SpecialBadge({ variant }: { variant: SpecialBadgeVariant }) {
  if (variant === "partenaire") {
    return (
      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-on-accent text-xs font-bold bg-accent">
        ⭐ Partenaire
      </span>
    );
  }
  if (variant === "coup-de-coeur") {
    return (
      <span className="self-start inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-pill bg-surface border border-black/5 shadow-sm text-sm font-extrabold tracking-tight text-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge-coup-de-coeur.png" alt="" aria-hidden className="h-7 w-7 shrink-0" />
        Coup de cœur
      </span>
    );
  }
  if (variant === "selection") {
    return (
      <span className="self-start inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-pill bg-surface border border-black/5 shadow-sm text-sm font-extrabold tracking-tight text-primary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badge-selection.png" alt="" aria-hidden className="h-7 w-7 shrink-0" />
        Sélection Koté Moris
      </span>
    );
  }
  // agence
  return (
    <span
      className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-white text-xs font-bold"
      style={{ background: AGENCY_COLOR }}
    >
      🏢 Agence organisatrice
    </span>
  );
}

/** Couleur d'accent latéral d'une fiche selon son badge / statut d'agence. */
export function accentColorFor(
  badge?: "partenaire" | "coup-de-coeur" | "selection",
  isAgency?: boolean
): string | undefined {
  if (badge === "coup-de-coeur") return COUP_DE_COEUR_COLOR;
  if (badge === "selection") return SELECTION_COLOR;
  if (badge === "partenaire") return "var(--accent)";
  if (isAgency) return AGENCY_COLOR;
  return undefined;
}
