"use client";

import type { Business } from "@/lib/types";
import { SUBCATEGORIES, PRICE_RANGES, CATEGORY_MAP } from "@/data/categories";
import { displayName, displayCity } from "@/lib/format";
import { accentColorFor } from "./Badge";
import { iconForKey, subIconFor, FACT_ICONS, CONTACT_ICONS } from "@/lib/icons";
import type { Icon } from "@phosphor-icons/react";

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: "Débutant",
  habitue: "Habitué",
  confirme: "Confirmé",
};

/** Faits chiffrés d'une fiche (distance, durée, prix d'entrée…) selon sa rubrique. */
export function metaFacts(b: Business): { Icon: Icon; label: string }[] {
  const facts: { Icon: Icon; label: string }[] = [];
  if (b.distance) facts.push({ Icon: FACT_ICONS.distance, label: b.distance });
  if (b.elevationGain) facts.push({ Icon: FACT_ICONS.elevationGain, label: b.elevationGain });
  if (b.duration) facts.push({ Icon: FACT_ICONS.duration, label: b.duration });
  if (b.entryPrice) facts.push({ Icon: FACT_ICONS.entryPrice, label: b.entryPrice });
  if (b.difficultyLevel) facts.push({ Icon: FACT_ICONS.difficultyLevel, label: DIFFICULTY_LABELS[b.difficultyLevel] });
  if (b.guideRecommended !== undefined && !b.isAgency)
    facts.push({ Icon: FACT_ICONS.guide, label: b.guideRecommended ? "Guide conseillé" : "Sans guide" });
  if (b.sportsListed) facts.push({ Icon: FACT_ICONS.sports, label: b.sportsListed });
  if (b.hasRestauration !== undefined)
    facts.push({ Icon: FACT_ICONS.restauration, label: b.hasRestauration ? "Restauration sur place" : "Pas de restauration" });
  if (b.ttvFriendly) facts.push({ Icon: FACT_ICONS.ttv, label: "Adapté télétravail" });
  if (b.kidsActivities) facts.push({ Icon: FACT_ICONS.kids, label: "Activités enfants" });
  if (b.sandType) facts.push({ Icon: FACT_ICONS.sand, label: b.sandType });
  if (b.beachActivities) facts.push({ Icon: FACT_ICONS.beach, label: b.beachActivities });
  if (b.beachLength) facts.push({ Icon: FACT_ICONS.distance, label: b.beachLength });
  if (b.animalsVisible) facts.push({ Icon: FACT_ICONS.animals, label: b.animalsVisible });
  if (b.golfHoles)
    facts.push({
      Icon: FACT_ICONS.golf,
      label: `${b.golfHoles} trous${b.golfPar ? ` par ${b.golfPar}` : ""}${b.golfLength ? `, ${b.golfLength}` : ""}`,
    });
  if (b.golfDesigner) facts.push({ Icon: FACT_ICONS.golfDesigner, label: b.golfDesigner });
  if (b.golfPricing) facts.push({ Icon: FACT_ICONS.golfPricing, label: b.golfPricing });
  return facts;
}

/** Fiche annuaire complète : photo, badges, tags, infos et actions de contact. */
export function BusinessCard({
  business: b,
  active,
  onSelect,
  onHover,
  nearbyKm,
  cardRef,
  hiddenKeys,
}: {
  business: Business;
  active: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  nearbyKm?: number;
  cardRef?: (el: HTMLElement | null) => void;
  /** Clés de tags/facettes déjà impliquées par le filtre actif → masquées. */
  hiddenKeys?: Set<string>;
}) {
  const accentColor = accentColorFor(b.badge, b.isAgency);
  const price = b.priceRange ? PRICE_RANGES.find((p) => p.key === b.priceRange) : undefined;
  // Sous-titre façon « Cuisine locale » : première rubrique/thème de la fiche.
  const firstTheme = b.themes?.find((t) => !hiddenKeys?.has(t) && t !== "kids-friendly");
  const subtitle = firstTheme ? SUBCATEGORIES[b.category]?.find((t) => t.key === firstTheme)?.label : undefined;
  const rowIcon = (firstTheme && subIconFor(firstTheme)) ?? subIconFor(b.category);

  return (
    <article
      ref={cardRef}
      onClick={() => onSelect(b.id)}
      onMouseEnter={() => onHover(b.id)}
      onMouseLeave={() => onHover(null)}
      className={`bg-surface border rounded-card p-2.5 shadow-card flex items-center gap-3 cursor-pointer transition-colors ${
        active ? "border-accent" : "border-border"
      }`}
      style={
        accentColor
          ? {
              borderLeftColor: accentColor,
              borderLeftWidth: 4,
              backgroundColor: `color-mix(in srgb, ${accentColor} 6%, var(--surface))`,
            }
          : undefined
      }
    >
      <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-primary-tint relative flex items-center justify-center text-primary-deep">
        {b.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={b.photoUrl}
            alt={displayName(b.name)}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : rowIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={rowIcon} alt="" aria-hidden loading="lazy" className="w-full h-full object-cover" />
        ) : (
          (() => {
            const CIcon = iconForKey(b.category);
            return CIcon ? <CIcon size={24} weight="duotone" aria-hidden /> : null;
          })()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {b.badge === "coup-de-coeur" && <span aria-hidden>💛</span>}
          {b.badge === "selection" && <span aria-hidden>🏅</span>}
          {b.badge === "partenaire" && <span aria-hidden>⭐</span>}
          <h3 className="m-0 font-serif text-[15.5px] font-semibold leading-[1.2] tracking-[-.005em] truncate">
            {displayName(b.name)}
          </h3>
        </div>
        {subtitle && <p className="m-0 text-muted text-[12.5px] leading-[1.4] truncate">{subtitle}</p>}
        <p className="m-0 text-muted text-[12.5px] leading-[1.4] flex items-center gap-1 mt-0.5">
          <CONTACT_ICONS.MapPin size={12} weight="fill" className="shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{displayCity(b.address)}</span>
          {price && <span className="shrink-0">· {price.symbol}</span>}
          {nearbyKm !== undefined && Number.isFinite(nearbyKm) && (
            <span className="shrink-0 ml-0.5 text-primary-deep font-semibold">
              · {nearbyKm < 10 ? nearbyKm.toFixed(1).replace(".", ",") : Math.round(nearbyKm)} km
            </span>
          )}
        </p>
      </div>
      <span
        className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-pill whitespace-nowrap max-w-[92px] truncate"
        style={{ background: `color-mix(in srgb, ${CATEGORY_MAP[b.category].color} 15%, var(--surface))`, color: CATEGORY_MAP[b.category].color }}
      >
        {CATEGORY_MAP[b.category].label}
      </span>
    </article>
  );
}
