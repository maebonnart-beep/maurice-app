"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";

/** Tuile de catégorie de l'écran d'accueil mobile (emoji coloré + libellé + nombre). */
export function CategoryTile({
  category,
  count,
  onClick,
}: {
  category: CategoryKey;
  count: number;
  onClick: () => void;
}) {
  const cat = CATEGORY_MAP[category];
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-2 p-3.5 rounded-tile border border-border bg-surface text-left shadow-sm active:scale-[.98] transition-transform"
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px]"
        style={{ background: `color-mix(in srgb, ${cat.color} 15%, var(--surface))` }}
      >
        {cat.emoji}
      </span>
      <span className="text-[14px] font-semibold leading-tight text-ink">{cat.label}</span>
      <span className="text-caption text-muted font-medium">
        {count} adresse{count > 1 ? "s" : ""}
      </span>
    </button>
  );
}
