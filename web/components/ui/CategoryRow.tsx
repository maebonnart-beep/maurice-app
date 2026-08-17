"use client";

import { ArrowRight } from "@phosphor-icons/react";
import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey, subIconFor, mascotFor } from "@/lib/icons";

/**
 * Position de la mascotte dans la ligne de catégorie — gauche/droite en
 * alternance pour casser la monotonie des 8 lignes.
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
 * Sous-texte (2 lignes) des 8 lignes catégorie — repris à l'identique de la
 * maquette fournie par la cliente (planche « Explorer Koté Moris »).
 */
const CATEGORY_SUBTEXT: Record<string, [string, string]> = {
  "manger-boire": ["Restaurants, cafés, bars", "Tables d'hôtes, spécialités locales"],
  "sortir-decouvrir": ["Plages, visites, excursions", "Culture, nature, lieux insolites"],
  "faire-du-sport": ["Activités sportives, clubs", "Aventures, sensations fortes"],
  "sante-bien-etre": ["Soins, bien-être, détente", "Yoga, spas, praticiens"],
  "acheter-equiper": ["Boutiques, créateurs, déco", "Équipements, accessoires"],
  "vie-pratique": ["Services, dépannage, entretien", "Transports, bricolage, astuces"],
  "famille-travail": ["Enfants, éducation, sorties en famille", "Télétravail, entrepreneuriat, services"],
  agenda: ["Événements, sorties, ateliers", "Bons plans du moment"],
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

  // Ligne « mascotte » (catégorie) : reprend à l'identique la maquette
  // « Explorer Koté Moris » de la cliente — bandeau mascotte détourée en
  // entier (object-contain, jamais rognée) à gauche ou à droite en
  // alternance (cf. MASCOT_POSITION), icône ronde + titre capitales +
  // sous-texte 2 lignes, bouton flèche rond du côté opposé à la mascotte.
  if (mascot && cat) {
    const pos = MASCOT_POSITION[resolvedKey] ?? "left";
    const angle = GRADIENT_ANGLE[resolvedKey] ?? 120;
    const subtext = CATEGORY_SUBTEXT[resolvedKey];

    // Le bouton flèche reste toujours à droite (jamais à gauche, même quand la
    // mascotte y est) — la mascotte se décale alors vers la gauche pour lui
    // laisser sa place.
    const ARROW_ZONE = 44;
    const BANNER_W = 152;
    const bannerRightInset = pos === "right" ? ARROW_ZONE : 0;

    const banner = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mascot}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 h-full w-[152px] object-contain ${
          pos === "right" ? "object-right scale-x-[-1]" : "left-0 object-left"
        }`}
        style={pos === "right" ? { right: bannerRightInset } : undefined}
      />
    );
    const text = (
      <span
        className="relative z-10 flex-1 min-w-0 flex flex-col justify-center gap-1"
        style={
          pos === "left"
            ? { marginLeft: 148, marginRight: ARROW_ZONE }
            : { marginRight: bannerRightInset + BANNER_W + 12 }
        }
      >
        <span className="flex items-center gap-1.5">
          {Icon && (
            <span
              className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full text-on-accent"
              style={{ background: cat.color }}
            >
              <Icon size={15} weight="bold" aria-hidden />
            </span>
          )}
          <span className="text-[14px] font-extrabold uppercase tracking-tight leading-tight text-ink truncate">
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
        {subtext && (
          <span className="text-[11.5px] leading-snug text-muted">
            {subtext[0]}
            <br />
            {subtext[1]}
          </span>
        )}
      </span>
    );
    const arrowBtn = (
      <span
        className="absolute z-10 right-2.5 top-1/2 -translate-y-1/2 shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-on-accent"
        style={{ background: cat.color }}
        aria-hidden
      >
        <ArrowRight size={16} weight="bold" />
      </span>
    );

    const rowBg = `linear-gradient(${angle}deg, color-mix(in srgb, ${cat.color} 22%, var(--surface)) 0%, color-mix(in srgb, ${cat.color} 6%, var(--surface)) 75%)`;
    const rowBorder = `1px solid color-mix(in srgb, ${cat.color} 30%, var(--border))`;

    return (
      <button
        onClick={onClick}
        className={`relative w-full min-h-[104px] flex items-center rounded-2xl py-2.5 text-left overflow-hidden active:scale-[.99] transition-transform ${
          pos === "left" ? "pl-2" : "pl-3"
        }`}
        style={{ background: rowBg, border: rowBorder }}
      >
        {banner}
        {text}
        {arrowBtn}
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
