"use client";

import type { Business } from "@/lib/types";
import { SUBCATEGORIES, PRICE_RANGES, CATEGORY_MAP, FILTER_GROUPS } from "@/data/categories";
import { displayName, displayCity } from "@/lib/format";
import { accentColorFor, SpecialBadge, AGENCY_COLOR } from "./Badge";
import { FavoriteButton } from "./FavoriteButton";
import { FACT_ICONS, CONTACT_ICONS, iconForKey, subIconFor } from "@/lib/icons";
import { eventColorFor, formatEventDate } from "@/lib/events";
import type { Icon } from "@phosphor-icons/react";

/** Toutes les options de filtre (cuisine, ambiance, discipline, spécialité…), à plat par clé. */
const FILTER_OPTION_MAP = Object.fromEntries(
  FILTER_GROUPS.flatMap((g) => g.options.map((o) => [o.key, o]))
);

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: "Débutant",
  habitue: "Habitué",
  confirme: "Confirmé",
};

/** Faits chiffrés d'une fiche (distance, durée, prix d'entrée…) selon sa rubrique. */
export function metaFacts(b: Business): { Icon: Icon; label: string }[] {
  const facts: { Icon: Icon; label: string }[] = [];
  if (b.period) facts.push({ Icon: FACT_ICONS.period, label: b.period });
  if (b.registrationDeadline)
    facts.push({ Icon: FACT_ICONS.registrationDeadline, label: `Inscriptions jusqu'au ${b.registrationDeadline}` });
  if (b.distance) facts.push({ Icon: FACT_ICONS.distance, label: b.distance });
  if (b.elevationGain) facts.push({ Icon: FACT_ICONS.elevationGain, label: b.elevationGain });
  if (b.duration) facts.push({ Icon: FACT_ICONS.duration, label: b.duration });
  if (b.entryPrice) facts.push({ Icon: FACT_ICONS.entryPrice, label: b.entryPrice });
  if (b.difficultyLevel) facts.push({ Icon: FACT_ICONS.difficultyLevel, label: DIFFICULTY_LABELS[b.difficultyLevel] });
  if (b.guideRecommended !== undefined && !b.isAgency)
    facts.push({
      Icon: FACT_ICONS.guide,
      label:
        b.guideRecommended === "required"
          ? "Guide obligatoire"
          : b.guideRecommended
            ? "Guide conseillé"
            : "Sans guide",
    });
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
  // Type de lieu (rubrique) : première rubrique/thème de la fiche, affiché en
  // tag coloré (couleur de la catégorie) pour dire au premier coup d'œil si
  // c'est un restaurant, une plage, une randonnée... — plus visible qu'un
  // sous-titre gris.
  const firstTheme = b.themes?.find((t) => !hiddenKeys?.has(t) && t !== "kids-friendly");
  const rubrique = firstTheme ? SUBCATEGORIES[b.category]?.find((t) => t.key === firstTheme) : undefined;
  const RubriqueIcon = firstTheme ? iconForKey(firstTheme) : null;
  const categoryColor = CATEGORY_MAP[b.category].color;
  const bannerIcon = (firstTheme && subIconFor(firstTheme)) ?? subIconFor(b.category);
  const BannerFallbackIcon = RubriqueIcon ?? iconForKey(b.category);
  // 1-2 infos concrètes pour ne pas se limiter au nom/adresse au 1er coup d'œil.
  const facts = metaFacts(b).slice(0, 2);
  // Tags de filtre (cuisine, ambiance, spécialité…) portés par la fiche —
  // quelques mots-clés visibles sans ouvrir la fiche.
  const filterTags = (b.filters ?? [])
    .filter((t) => !hiddenKeys?.has(t) && FILTER_OPTION_MAP[t])
    .slice(0, 3)
    .map((t) => FILTER_OPTION_MAP[t]);
  // Agenda : la date prime sur tout le reste pour un événement — mise en
  // avant en bandeau plein-largeur en haut de fiche plutôt que noyée dans le texte.
  const eventDateLabel = b.category === "agenda" ? formatEventDate(b.eventStartDate) : null;
  const eventBarColor = eventDateLabel ? eventColorFor(b) : undefined;

  return (
    <article
      ref={cardRef}
      onClick={() => onSelect(b.id)}
      onMouseEnter={() => onHover(b.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative bg-surface border rounded-card shadow-card cursor-pointer transition-colors overflow-hidden ${
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
      {eventDateLabel && (
        <p
          className="m-0 px-2.5 py-1 text-[11px] font-bold text-white text-center tracking-wide"
          style={{ background: eventBarColor }}
        >
          {eventDateLabel}
        </p>
      )}
      <div className="relative flex items-center gap-3 p-2.5">
      {(b.badge === "selection" || b.themes?.includes("kids-friendly")) && (
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          {b.badge === "selection" && (
            <SpecialBadge variant="selection" className="h-9 w-9 shrink-0 drop-shadow-md" />
          )}
          {b.themes?.includes("kids-friendly") && (
            <SpecialBadge variant="kids-friendly" className="h-9 w-9 shrink-0 drop-shadow-md" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {b.badge === "partenaire" && <span aria-hidden>⭐</span>}
          <h3 className="m-0 font-serif text-[15.5px] font-semibold leading-[1.2] tracking-[-.005em] truncate">
            {displayName(b.name)}
          </h3>
        </div>
        {(rubrique || b.isAgency) && (
          <p className="m-0 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {rubrique && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-pill"
                style={{ background: `color-mix(in srgb, ${categoryColor} 15%, var(--surface))`, color: categoryColor }}
              >
                {RubriqueIcon ? (
                  <RubriqueIcon size={11} weight="bold" aria-hidden />
                ) : (
                  <span aria-hidden>{rubrique.emoji}</span>
                )}
                {rubrique.label}
              </span>
            )}
            {b.isAgency && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-pill text-white"
                style={{ background: AGENCY_COLOR }}
              >
                🏢 Agence
              </span>
            )}
          </p>
        )}
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
        {b.hours && (
          <p className="m-0 text-muted text-[12px] leading-[1.4] flex items-center gap-1 mt-0.5">
            <CONTACT_ICONS.Clock size={12} weight="bold" className="shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{b.hours}</span>
          </p>
        )}
        {filterTags.length > 0 && (
          <p className="m-0 mt-1 flex items-center gap-1.5 flex-wrap">
            {filterTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-pill bg-primary-tint text-primary-deep"
              >
                <span aria-hidden>{tag.emoji}</span>
                {tag.label}
              </span>
            ))}
          </p>
        )}
        {facts.length > 0 && (
          <p className="m-0 mt-1 flex items-center gap-2.5 flex-wrap">
            {facts.map(({ Icon: FIcon, label }, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11.5px] text-primary-deep font-semibold">
                <FIcon size={12} weight="bold" className="shrink-0 opacity-80" aria-hidden />
                <span className="truncate max-w-[140px]">{label}</span>
              </span>
            ))}
          </p>
        )}
        {b.description && (
          <p className="m-0 mt-1 text-ink/70 text-[12px] leading-[1.4] line-clamp-2">{b.description}</p>
        )}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: "var(--primary-tint)", color: "var(--primary-deep)" }}
          aria-hidden
        >
          {bannerIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerIcon} alt="" className="w-full h-full object-cover" />
          ) : (
            BannerFallbackIcon && <BannerFallbackIcon size={17} weight="duotone" />
          )}
        </span>
        <FavoriteButton id={b.id} size={17} className="text-muted" />
      </div>
      </div>
    </article>
  );
}
