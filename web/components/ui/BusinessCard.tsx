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

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: "Débutant",
  habitue: "Habitué",
  confirme: "Confirmé",
};

/** Faits chiffrés d'une fiche (distance, durée, prix d'entrée…) selon sa rubrique. */
export function metaFacts(b: Business): { icon: string; label: string }[] {
  const facts: { icon: string; label: string }[] = [];
  if (b.distance) facts.push({ icon: "📏", label: b.distance });
  if (b.elevationGain) facts.push({ icon: "⛰️", label: b.elevationGain });
  if (b.duration) facts.push({ icon: "⏱️", label: b.duration });
  if (b.entryPrice) facts.push({ icon: "🎟️", label: b.entryPrice });
  if (b.difficultyLevel) facts.push({ icon: "🥾", label: DIFFICULTY_LABELS[b.difficultyLevel] });
  if (b.guideRecommended !== undefined && !b.isAgency)
    facts.push({ icon: "🧭", label: b.guideRecommended ? "Guide conseillé" : "Sans guide" });
  if (b.sportsListed) facts.push({ icon: "🏃", label: b.sportsListed });
  if (b.hasRestauration !== undefined)
    facts.push({ icon: "🍽️", label: b.hasRestauration ? "Restauration sur place" : "Pas de restauration" });
  if (b.ttvFriendly) facts.push({ icon: "💻", label: "Adapté télétravail" });
  if (b.kidsActivities) facts.push({ icon: "🧒", label: "Activités enfants" });
  if (b.sandType) facts.push({ icon: "🏖️", label: b.sandType });
  if (b.beachActivities) facts.push({ icon: "🎯", label: b.beachActivities });
  if (b.beachLength) facts.push({ icon: "📏", label: b.beachLength });
  if (b.animalsVisible) facts.push({ icon: "🦁", label: b.animalsVisible });
  if (b.golfHoles)
    facts.push({
      icon: "⛳",
      label: `${b.golfHoles} trous${b.golfPar ? ` par ${b.golfPar}` : ""}${b.golfLength ? `, ${b.golfLength}` : ""}`,
    });
  if (b.golfDesigner) facts.push({ icon: "✏️", label: b.golfDesigner });
  if (b.golfPricing) facts.push({ icon: "💰", label: b.golfPricing });
  return facts;
}

/** Fiche annuaire complète : photo, badges, tags, infos et actions de contact. */
export function BusinessCard({
  business: b,
  active,
  onSelect,
  onHover,
  cardRef,
}: {
  business: Business;
  active: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
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
          {b.isAgency && <SpecialBadge variant="agence" />}
          {b.themes?.map((tKey) => {
            const theme = SUBCATEGORIES[b.category]?.find((t) => t.key === tKey);
            return theme ? (
              <Tag key={tKey} icon={theme.emoji}>
                {theme.label}
              </Tag>
            ) : null;
          })}
          {price && (
            <Tag icon={price.symbol}>{price.label}</Tag>
          )}
          {b.takeaway && <Tag icon="🥡">À emporter</Tag>}
        </div>
        <h3 className="m-0 font-serif text-[17px] font-semibold leading-[1.2] tracking-[-.005em]">
          {displayName(b.name)}
        </h3>
        <p className="m-0 text-muted text-body leading-[1.5]">📍 {displayCity(b.address)}</p>
        {b.description && (
          <p className="m-0 text-ink text-body leading-[1.5] -mt-1">{b.description}</p>
        )}
        {b.hours && (
          <p className="m-0 text-muted text-caption leading-[1.4] -mt-1">🕒 {b.hours}</p>
        )}
        {facts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-1">
            {facts.map((f, i) => (
              <Tag key={i} icon={f.icon}>
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
                icon="📞"
                onClick={(e) => {
                  e.stopPropagation();
                  trackEvent(b.id, "call");
                }}
              >
                Appeler
              </ActionButton>
            ) : (
              <ActionButton disabled icon="📞">
                Sans tél.
              </ActionButton>
            ))}
          {b.email && (
            <ActionButton href={`mailto:${b.email}`} icon="✉️" onClick={(e) => e.stopPropagation()}>
              Email
            </ActionButton>
          )}
          {waNumber && (
            <ActionButton
              href={whatsappLink(waNumber)}
              external
              icon="💬"
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
              icon="🌐"
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
              icon="📍"
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
