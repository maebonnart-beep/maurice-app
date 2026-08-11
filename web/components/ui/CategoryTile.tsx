"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey } from "@/lib/icons";

/**
 * Tuile de navigation (icône + libellé).
 * - `category` fourni → pastille colorée à la couleur de la catégorie.
 * - `emoji`/`label` explicites (sans `category`) → variante neutre (pastille teal claire).
 * L'icône est une icône Phosphor (trait moderne) résolue depuis `iconKey`
 * (sinon la catégorie), avec repli sur l'emoji si aucune icône n'est mappée.
 */
export function CategoryTile({
  category,
  emoji,
  label,
  iconKey,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  iconKey?: string;
  /** Conservé pour compat des appels ; le nombre n'est plus affiché sur la tuile. */
  count?: number;
  onClick: () => void;
}) {
  const cat = category ? CATEGORY_MAP[category] : null;
  const displayEmoji = emoji ?? cat?.emoji ?? "";
  const displayLabel = label ?? cat?.label ?? "";
  const iconBg = cat
    ? `color-mix(in srgb, ${cat.color} 15%, var(--surface))`
    : "var(--primary-tint)";
  const iconColor = cat ? cat.color : "var(--primary-deep)";
  const Icon = iconForKey(iconKey ?? category ?? "");

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-tile border border-border bg-surface text-center shadow-sm active:scale-[.98] transition-transform"
    >
      <span
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {Icon ? (
          <Icon size={32} weight="duotone" aria-hidden />
        ) : (
          <span className="text-[34px] leading-none">{displayEmoji}</span>
        )}
      </span>
      <span className="text-[14px] font-semibold leading-tight text-ink">{displayLabel}</span>
    </button>
  );
}
