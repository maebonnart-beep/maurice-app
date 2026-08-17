"use client";

import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey, subIconFor, mascotFor } from "@/lib/icons";

/**
 * Position de la mascotte dans la ligne de catégorie — gauche/droite en
 * alternance. Pas de position « centrée » : elle empilait le texte sous la
 * mascotte et augmentait la hauteur de la carte, cassant l'uniformité des 8
 * lignes (toutes doivent faire la même taille, avec les mêmes données).
 */
const MASCOT_POSITION: Record<string, "left" | "right"> = {
  "manger-boire": "left",
  "sortir-decouvrir": "right",
  "faire-du-sport": "left",
  "sante-bien-etre": "right",
  "acheter-equiper": "left",
  "vie-pratique": "right",
  "famille-travail": "left",
  agenda: "right",
};

/** Angle du dégradé de fond, varié par catégorie pour éviter 8 lignes identiques. */
const GRADIENT_ANGLE: Record<string, number> = {
  "manger-boire": 120,
  "sortir-decouvrir": 60,
  "faire-du-sport": 150,
  "sante-bien-etre": 90,
  "acheter-equiper": 30,
  "vie-pratique": 135,
  "famille-travail": 75,
  agenda: 105,
};

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
  // Mascotte poulpe uniquement sur les lignes de catégorie (niveau 1) —
  // les rubriques (niveau 2) gardent leur picto plat (subIcon).
  const mascot = category ? mascotFor(resolvedKey) : null;
  const subIcon = subIconFor(resolvedKey);
  const Icon = iconForKey(resolvedKey);

  const countLabel =
    count !== undefined ? `${count} adresse${count > 1 ? "s" : ""}` : undefined;

  // Ligne « mascotte » (catégorie) : fond lavis dégradé dans la couleur de la
  // catégorie (angle varié, cf. GRADIENT_ANGLE), texte et badge agrandis,
  // mascotte à gauche ou à droite (cf. MASCOT_POSITION) — même taille et
  // mêmes données sur les 8 lignes, aucune n'est plus haute qu'une autre.
  if (mascot && cat) {
    const pos = MASCOT_POSITION[resolvedKey] ?? "left";
    const angle = GRADIENT_ANGLE[resolvedKey] ?? 120;
    const labelColor = `color-mix(in srgb, ${cat.color} 55%, var(--ink))`;

    // Mascotte posée directement sur le fond (pas de bulle circulaire) : le
    // détourage transparent suffit à la faire ressortir. Volontairement plus
    // grande que la ligne — elle déborde légèrement du cadre pour un effet
    // plus dynamique.
    const badge = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mascot}
        alt=""
        aria-hidden
        className="shrink-0 w-[132px] h-[132px] -my-4 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]"
      />
    );
    const text = (
      <span className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <span className="flex items-start gap-1.5">
          <span className="text-[17px] font-extrabold leading-tight" style={{ color: labelColor }}>
            {displayLabel}
          </span>
          {locked && (
            <span
              className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[9.5px] font-bold text-on-accent"
              style={{ background: "var(--accent)" }}
            >
              🔒 Premium
            </span>
          )}
        </span>
        {countLabel && (
          <span className="text-[12px] font-semibold" style={{ color: `color-mix(in srgb, ${cat.color} 70%, var(--muted))` }}>
            {countLabel}
          </span>
        )}
      </span>
    );
    const chev = (
      <span className="shrink-0 text-[20px] font-bold leading-none" style={{ color: cat.color }} aria-hidden>
        ›
      </span>
    );

    const rowBg = `linear-gradient(${angle}deg, color-mix(in srgb, ${cat.color} 30%, var(--surface)) 0%, color-mix(in srgb, ${cat.color} 8%, var(--surface)) 75%)`;
    const rowBorder = `1px solid color-mix(in srgb, ${cat.color} 38%, var(--border))`;

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3.5 rounded-2xl py-2.5 text-left active:scale-[.99] transition-transform ${
          pos === "right" ? "pl-4 pr-2.5" : "px-3.5"
        }`}
        style={{ background: rowBg, border: rowBorder }}
      >
        {pos === "left" ? (
          <>
            {badge}
            {text}
            {chev}
          </>
        ) : (
          <>
            {text}
            {badge}
            {chev}
          </>
        )}
      </button>
    );
  }

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
        {countLabel && <span className="block text-[12px] text-muted">{countLabel}</span>}
      </span>
      <span className="shrink-0 text-[18px] font-bold leading-none" style={{ color: "var(--accent)" }} aria-hidden>
        ›
      </span>
    </button>
  );
}
