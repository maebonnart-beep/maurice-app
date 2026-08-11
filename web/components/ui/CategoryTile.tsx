"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";

/**
 * Tuile de navigation (emoji + libellé + nombre).
 * - `category` fourni → pastille colorée à la couleur de la catégorie.
 * - `emoji`/`label` explicites (sans `category`) → variante neutre (fond surface-2),
 *   pour les sous-rubriques, « Autres » et « Tout … ».
 */
export function CategoryTile({
  category,
  emoji,
  label,
  count,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  count?: number;
  onClick: () => void;
}) {
  const cat = category ? CATEGORY_MAP[category] : null;
  const displayEmoji = emoji ?? cat?.emoji ?? "";
  const displayLabel = label ?? cat?.label ?? "";
  const iconBg = cat
    ? `color-mix(in srgb, ${cat.color} 15%, var(--surface))`
    : "var(--primary-tint)";

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3.5 rounded-tile border border-border bg-surface text-left shadow-sm active:scale-[.98] transition-transform"
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]"
        style={{ background: iconBg }}
      >
        {displayEmoji}
      </span>
      <span className="text-[14px] font-semibold leading-tight text-ink">{displayLabel}</span>
      {count !== undefined && (
        <span className="text-caption text-muted font-medium">
          {count} adresse{count > 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}
