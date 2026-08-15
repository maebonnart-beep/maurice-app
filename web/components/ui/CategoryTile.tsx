"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey } from "@/lib/icons";

/**
 * Tuile de navigation « basique » : pastille ronde/carrée avec icône Phosphor
 * (trait moderne, pas d'illustration), libellé centré en dessous. Volontairement
 * simple — pas de photo ni d'illustration 3D, pour rester cohérent partout.
 * - `category` fourni → pastille colorée à la couleur de la catégorie.
 * - `emoji`/`label` explicites (sans `category`) → variante neutre (pastille teal claire).
 */
export function CategoryTile({
  category,
  emoji,
  label,
  iconKey,
  locked,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  iconKey?: string;
  /** Univers Premium : badge cadenas sur la pastille. */
  locked?: boolean;
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
  const resolvedKey = iconKey ?? category ?? "";
  const Icon = iconForKey(resolvedKey);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-1 active:scale-[.97] transition-transform"
    >
      <span
        className="relative w-full max-w-[72px] aspect-square rounded-2xl flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {Icon ? (
          <Icon size={28} weight="duotone" aria-hidden />
        ) : (
          <span className="text-[26px] leading-none">{displayEmoji}</span>
        )}
        {locked && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-on-accent"
            style={{ background: "var(--accent)" }}
            aria-label="Premium"
          >
            🔒
          </span>
        )}
      </span>
      <span className="text-[12px] font-bold leading-tight text-center text-primary-deep">
        {displayLabel}
      </span>
    </button>
  );
}
