"use client";

import type { Business } from "@/lib/types";
import { SUBCATEGORIES, PRICE_RANGES } from "@/data/categories";
import { trackEvent } from "@/lib/track";
import {
  tel,
  displayName,
  displayCity,
  webLabel,
  whatsappLink,
  whatsappNumber,
} from "@/lib/format";
import { CategoryBadge, SpecialBadge, accentColorFor } from "./Badge";
import { Tag } from "./Tag";
import { ActionButton } from "./ActionButton";
import { iconForKey, FACT_ICONS, CONTACT_ICONS } from "@/lib/icons";
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
}: {
  business: Business;
  active: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  nearbyKm?: number;
  cardRef?: (el: HTMLElement | null) => void;
}) {
  const accentColor = accentColorFor(b.badge, b.isAgency);
  const waNumber = whatsappNumber(b);
  const facts = metaFacts(b);
  const price = b.priceRange ? PRICE_RANGES.find((p) => p.key === b.priceRange) : undefined;

  return (
    <article
      ref={cardRef}
      onClick={() => onSelect(b.id)}
      onMouseEnter={() => onHover(b.id)}
      onMouseLeave={() => onHover(null)}
      className={`bg-surface border rounded-card p-4 shadow-card flex gap-3.5 cursor-pointer transition-colors ${
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
      {b.photoUrl && (
        <div className="shrink-0 w-[76px] h-[76px] rounded-xl overflow-hidden bg-surface-2 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.photoUrl}
            alt={displayName(b.name)}
            loading="lazy"
            className="w-full h-full object-cover"
          />
          {b.photoCredit && (
            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] leading-none text-white/90 bg-black/40">
              {b.photoCredit}
            </span>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {b.eventPeriod && (
          <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-accent text-on-accent text-[12.5px] font-extrabold tracking-tight">
            📅 {b.eventPeriod}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={b.category} />
          {b.badge === "partenaire" && <SpecialBadge variant="partenaire" />}
          {b.badge === "coup-de-coeur" && <SpecialBadge variant="coup-de-coeur" />}
          {b.badge === "selection" && <SpecialBadge variant="selection" />}
          {b.themes?.includes("kids-friendly") && <SpecialBadge variant="kids-friendly" />}
          {b.isAgency && <SpecialBadge variant="agence" />}
          {b.themes?.map((tKey) => {
            // « kids-friendly » est affiché en badge illustré ci-dessus, pas en tag.
            if (tKey === "kids-friendly") return null;
            const theme = SUBCATEGORIES[b.category]?.find((t) => t.key === tKey);
            if (!theme) return null;
            const TIcon = iconForKey(tKey);
            return (
              <Tag key={tKey} icon={TIcon ? <TIcon size={13} weight="bold" aria-hidden /> : theme.emoji}>
                {theme.label}
              </Tag>
            );
          })}
          {price && (
            <Tag icon={price.symbol}>{price.label}</Tag>
          )}
          {b.takeaway && <Tag icon="🥡">À emporter</Tag>}
        </div>
        <h3 className="m-0 font-serif text-[17px] font-semibold leading-[1.2] tracking-[-.005em]">
          {displayName(b.name)}
        </h3>
        <p className="m-0 text-muted text-body leading-[1.5] flex items-center gap-1">
          <CONTACT_ICONS.MapPin size={14} weight="fill" className="shrink-0 opacity-70" aria-hidden />
          {displayCity(b.address)}
          {nearbyKm !== undefined && Number.isFinite(nearbyKm) && (
            <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-pill bg-primary-tint text-primary-deep text-[11px] font-bold">
              à {nearbyKm < 10 ? nearbyKm.toFixed(1).replace(".", ",") : Math.round(nearbyKm)} km
            </span>
          )}
        </p>
        {b.description && (
          <p className="m-0 text-ink text-body leading-[1.5] -mt-1">{b.description}</p>
        )}
        {b.hours && (
          <p className="m-0 text-muted text-caption leading-[1.4] -mt-1 flex items-center gap-1">
            <CONTACT_ICONS.Clock size={13} weight="bold" className="shrink-0 opacity-70" aria-hidden />
            {b.hours}
          </p>
        )}
        {facts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {facts.map((f, i) => (
              <Tag key={i} icon={<f.Icon size={13} weight="bold" aria-hidden />}>
                {f.label}
              </Tag>
            ))}
          </div>
        )}
        {b.promoText && (
          <p className="m-0 text-body leading-[1.45] text-primary-deep border-l-2 border-primary pl-2.5 py-0.5">
            💬 <span className="italic">{b.promoText}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-2 pt-0.5">
          {!b.themes?.includes("plages") &&
            (b.phone ? (
              <ActionButton
                href={tel(b.phone)}
                variant="primary"
                icon={<CONTACT_ICONS.Phone size={15} weight="fill" aria-hidden />}
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent(b.id, "call");
                }}
              >
                Appeler
              </ActionButton>
            ) : (
              <ActionButton disabled icon={<CONTACT_ICONS.Phone size={15} weight="fill" aria-hidden />}>
                Sans tél.
              </ActionButton>
            ))}
          {b.email && (
            <ActionButton
              href={`mailto:${b.email}`}
              icon={<CONTACT_ICONS.EnvelopeSimple size={15} weight="bold" aria-hidden />}
              onClick={(e) => e.stopPropagation()}
            >
              Email
            </ActionButton>
          )}
          {waNumber && (
            <ActionButton
              href={whatsappLink(waNumber)}
              external
              icon={<CONTACT_ICONS.WhatsappLogo size={15} weight="fill" aria-hidden />}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(b.id, "whatsapp");
              }}
            >
              WhatsApp
            </ActionButton>
          )}
          {b.website && (
            <ActionButton
              href={b.website}
              external
              icon={<CONTACT_ICONS.Globe size={15} weight="bold" aria-hidden />}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(b.id, "website");
              }}
            >
              {webLabel(b.website)}
            </ActionButton>
          )}
          {b.googleMapsUrl && (
            <ActionButton
              href={b.googleMapsUrl}
              external
              icon={<CONTACT_ICONS.NavigationArrow size={15} weight="fill" aria-hidden />}
              onClick={(e) => {
                e.stopPropagation();
                trackEvent(b.id, "directions");
              }}
            >
              Itinéraire
            </ActionButton>
          )}
        </div>
      </div>
    </article>
  );
}
