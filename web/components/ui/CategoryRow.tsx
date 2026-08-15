"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey } from "@/lib/icons";

/**
 * Ligne de navigation (icône Phosphor dans un rond + libellé + compteur +
 * chevron). Variante « liste » de CategoryTile, en icônes simples (pas
 * d'illustration), pour rester cohérent avec la grille du niveau 1.
 */
export function CategoryRow({
  category,
  emoji,
  label,
  iconKey,
  count,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  iconKey?: string;
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
      className="w-full flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 text-left shadow-sm active:scale-[.99] transition-transform"
    >
      <span
        className="shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: iconBg, color: iconColor }}
      >
        {Icon ? (
          <Icon size={22} weight="duotone" aria-hidden />
        ) : (
          <span className="text-[20px] leading-none">{displayEmoji}</span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold text-ink truncate">{displayLabel}</span>
        {count !== undefined && (
          <span className="block text-[12px] text-muted">
            {count} adresse{count > 1 ? "s" : ""}
          </span>
        )}
      </span>
      <span className="shrink-0 text-[18px] font-bold leading-none" style={{ color: "var(--accent)" }} aria-hidden>
        ›
      </span>
    </button>
  );
}
