"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey, subIconFor } from "@/lib/icons";

/**
 * Ligne de navigation (icône dans un rond + libellé + compteur + chevron).
 * Utilise l'icône illustrée découpée (planche fournie par la cliente) quand
 * disponible pour la clé, sinon repli sur l'icône Phosphor simple.
 */
export function CategoryRow({
  category,
  emoji,
  label,
  iconKey,
  count,
  locked,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  iconKey?: string;
  count?: number;
  /** Rubrique réservée aux membres Premium : badge cadenas à côté du libellé. */
  locked?: boolean;
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
  const subIcon = subIconFor(resolvedKey);
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
        {subIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={subIcon} alt="" aria-hidden className="w-full h-full object-cover" />
        ) : Icon ? (
          <Icon size={22} weight="duotone" aria-hidden />
        ) : (
          <span className="text-[20px] leading-none">{displayEmoji}</span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-bold text-ink truncate">{displayLabel}</span>
          {locked && (
            <span
              className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[9.5px] font-bold text-on-accent"
              style={{ background: "var(--accent)" }}
            >
              🔒 Premium
            </span>
          )}
        </span>
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
