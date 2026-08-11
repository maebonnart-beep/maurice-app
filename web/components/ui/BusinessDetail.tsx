"use client";

import { useEffect } from "react";
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
import { metaFacts } from "./BusinessCard";
import { iconForKey, CONTACT_ICONS } from "@/lib/icons";

/**
 * Vue détail « plein écran » d'une fiche : ouverte au clic depuis la liste/carte.
 * Superposition modale avec en-tête « Retour », photo agrandie et toutes les infos.
 */
export function BusinessDetail({
  business: b,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const accentColor = accentColorFor(b.badge, b.isAgency);
  const waNumber = whatsappNumber(b);
  const facts = metaFacts(b);
  const price = b.priceRange ? PRICE_RANGES.find((p) => p.key === b.priceRange) : undefined;

  // Échap ferme, et on verrouille le scroll de l'arrière-plan.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50" role="dialog" aria-modal="true">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-auto lg:m-auto w-full lg:max-w-[720px] max-h-[92vh] lg:max-h-[88vh] bg-surface rounded-t-[20px] lg:rounded-card shadow-pop flex flex-col overflow-hidden">
        {/* En-tête collant : Retour + fermer */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-surface">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-border bg-surface text-[13.5px] font-semibold text-primary-deep active:scale-[.98]"
          >
            ← Retour
          </button>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-2 font-bold text-lg"
          >
            ×
          </button>
        </div>

        <div
          className="overflow-y-auto"
          style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
        >
          {b.photoUrl && (
            <div className="relative w-full h-[220px] lg:h-[300px] bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.photoUrl}
                alt={displayName(b.name)}
                className="w-full h-full object-cover"
              />
              {b.photoCredit && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] leading-none text-white/90 bg-black/40">
                  {b.photoCredit}
                </span>
              )}
            </div>
          )}

          <div className="p-5 flex flex-col gap-3">
            {b.eventPeriod && (
              <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-accent text-on-accent text-[13px] font-extrabold tracking-tight">
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
                if (!theme) return null;
                const TIcon = iconForKey(tKey);
                return (
                  <Tag key={tKey} icon={TIcon ? <TIcon size={13} weight="bold" aria-hidden /> : theme.emoji}>
                    {theme.label}
                  </Tag>
                );
              })}
              {price && <Tag icon={price.symbol}>{price.label}</Tag>}
              {b.takeaway && <Tag icon="🥡">À emporter</Tag>}
            </div>

            <h2 className="m-0 font-serif text-[24px] font-semibold leading-[1.15] tracking-[-.01em]">
              {displayName(b.name)}
            </h2>
            <p className="m-0 text-muted text-[14px] leading-[1.5] flex items-center gap-1.5">
              <CONTACT_ICONS.MapPin size={15} weight="fill" className="shrink-0 opacity-70" aria-hidden />
              {displayCity(b.address)}
            </p>

            {b.description && (
              <p className="m-0 text-ink text-[14.5px] leading-[1.6]">{b.description}</p>
            )}
            {b.hours && (
              <p className="m-0 text-muted text-[13px] leading-[1.45] flex items-center gap-1.5">
                <CONTACT_ICONS.Clock size={14} weight="bold" className="shrink-0 opacity-70" aria-hidden />
                {b.hours}
              </p>
            )}

            {facts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {facts.map((f, i) => (
                  <Tag key={i} icon={<f.Icon size={13} weight="bold" aria-hidden />}>
                    {f.label}
                  </Tag>
                ))}
              </div>
            )}

            {b.promoText && (
              <p className="m-0 text-[14px] leading-[1.5] text-primary-deep border-l-2 border-primary pl-3 py-0.5">
                💬 <span className="italic">{b.promoText}</span>
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {b.phone ? (
                <ActionButton
                  href={tel(b.phone)}
                  variant="primary"
                  icon={<CONTACT_ICONS.Phone size={16} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "call")}
                >
                  Appeler
                </ActionButton>
              ) : (
                <ActionButton disabled icon={<CONTACT_ICONS.Phone size={16} weight="fill" aria-hidden />}>
                  Sans tél.
                </ActionButton>
              )}
              {b.email && (
                <ActionButton
                  href={`mailto:${b.email}`}
                  icon={<CONTACT_ICONS.EnvelopeSimple size={16} weight="bold" aria-hidden />}
                >
                  Email
                </ActionButton>
              )}
              {waNumber && (
                <ActionButton
                  href={whatsappLink(waNumber)}
                  external
                  icon={<CONTACT_ICONS.WhatsappLogo size={16} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "whatsapp")}
                >
                  WhatsApp
                </ActionButton>
              )}
              {b.website && (
                <ActionButton
                  href={b.website}
                  external
                  icon={<CONTACT_ICONS.Globe size={16} weight="bold" aria-hidden />}
                  onClick={() => trackEvent(b.id, "website")}
                >
                  {webLabel(b.website)}
                </ActionButton>
              )}
              {b.googleMapsUrl && (
                <ActionButton
                  href={b.googleMapsUrl}
                  external
                  icon={<CONTACT_ICONS.NavigationArrow size={16} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "directions")}
                >
                  Itinéraire
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
