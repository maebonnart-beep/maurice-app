"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey, thematicIconFor } from "@/lib/icons";

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
  locked,
  accent,
  onClick,
}: {
  category?: CategoryKey;
  emoji?: string;
  label?: string;
  iconKey?: string;
  /** Univers Premium : anneau doré + badge cadenas. */
  locked?: boolean;
  /** Couleur de l'univers → anneau autour de l'icône + bord de tuile teinté. */
  accent?: string;
  /** Conservé pour compat des appels ; le nombre n'est plus affiché sur la tuile. */
  count?: number;
  onClick: () => void;
}) {
  const cat = category ? CATEGORY_MAP[category] : null;
  const displayEmoji = emoji ?? cat?.emoji ?? "";
  const displayLabel = label ?? cat?.label ?? "";
  const tone = accent ?? cat?.color ?? null;
  const iconBg = tone
    ? `color-mix(in srgb, ${tone} 15%, var(--surface))`
    : "var(--primary-tint)";
  const iconColor = tone ?? "var(--primary-deep)";
  const resolvedKey = iconKey ?? category ?? "";
  const thematic = thematicIconFor(resolvedKey);
  const Icon = iconForKey(resolvedKey);

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-2.5 p-4 rounded-tile border text-center shadow-sm active:scale-[.98] transition-transform"
      style={
        locked
          ? { borderColor: "var(--accent)", borderWidth: 2, background: "color-mix(in srgb, var(--accent) 10%, var(--surface))" }
          : tone
            ? { borderColor: `color-mix(in srgb, ${tone} 35%, var(--border))`, background: "var(--surface)" }
            : { borderColor: "var(--border)", background: "var(--surface)" }
      }
    >
      {locked && (
        <span
          className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold text-on-accent"
          style={{ background: "var(--accent)" }}
        >
          🔒 Premium
        </span>
      )}
      {thematic ? (
        // Icône thématique illustrée : occupe toute la pastille (disque crème intégré).
        // Anneau à la couleur de l'univers pour l'harmonisation « par couleur ».
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thematic}
          alt=""
          aria-hidden
          className="w-16 h-16 rounded-full object-cover"
          style={tone ? { boxShadow: `0 0 0 3px color-mix(in srgb, ${tone} 65%, var(--surface))` } : undefined}
        />
      ) : (
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
      )}
      <span className="text-[14px] font-semibold leading-tight text-ink">{displayLabel}</span>
    </button>
  );
}
