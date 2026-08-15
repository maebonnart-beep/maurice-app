"use client";

import { useEffect, useState, type ReactNode } from "react";
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
import { SpecialBadge, accentColorFor } from "./Badge";
import { Tag } from "./Tag";
import { metaFacts } from "./BusinessCard";
import { iconForKey, CONTACT_ICONS } from "@/lib/icons";
import { ArrowLeft } from "@phosphor-icons/react";

/** Action circulaire (Appeler, Itinéraire, Site web…) : icône ronde + libellé dessous. */
function CircleAction({
  href,
  icon,
  children,
  external = false,
  disabled = false,
  onClick,
}: {
  href?: string;
  icon: ReactNode;
  children: ReactNode;
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          disabled ? "bg-surface-2 text-muted" : "bg-primary-tint text-primary-deep"
        }`}
      >
        {icon}
      </span>
      <span className={`text-[11.5px] font-semibold leading-tight ${disabled ? "text-muted" : "text-ink"}`}>
        {children}
      </span>
    </>
  );
  const cls = "flex flex-col items-center gap-1 w-16 shrink-0";
  if (disabled) {
    return (
      <span className={`${cls} opacity-50`} aria-disabled="true">
        {inner}
      </span>
    );
  }
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cls}
    >
      {inner}
    </a>
  );
}

/**
 * Vue détail « plein écran » d'une fiche : ouverte au clic depuis la liste/carte.
 * Photo plein cadre avec bouton retour flottant, infos condensées, actions rondes.
 */
export function BusinessDetail({
  business: b,
  onClose,
  hiddenKeys,
}: {
  business: Business;
  onClose: () => void;
  /** Clés de tags/facettes déjà impliquées par le filtre actif → masquées. */
  hiddenKeys?: Set<string>;
}) {
  const accentColor = accentColorFor(b.badge, b.isAgency);
  const waNumber = whatsappNumber(b);
  const facts = metaFacts(b);
  const price = b.priceRange ? PRICE_RANGES.find((p) => p.key === b.priceRange) : undefined;
  const [descExpanded, setDescExpanded] = useState(false);
  const firstTheme = b.themes?.find((t) => !hiddenKeys?.has(t) && t !== "kids-friendly");
  const subtitle = firstTheme ? SUBCATEGORIES[b.category]?.find((t) => t.key === firstTheme)?.label : undefined;
  const CategoryIcon = iconForKey(b.category);

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
        <div className="overflow-y-auto">
          {/* Photo plein cadre, bouton retour flottant (pas de barre séparée). */}
          <div className="relative w-full h-[220px] lg:h-[300px] bg-surface-2 shrink-0">
            {b.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.photoUrl} alt={displayName(b.name)} className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-primary-deep bg-primary-tint">
                {CategoryIcon && <CategoryIcon size={40} weight="duotone" aria-hidden />}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Retour"
              className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm active:scale-[.95]"
            >
              <ArrowLeft size={18} weight="bold" aria-hidden />
            </button>
            {b.photoCredit && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] leading-none text-white/90 bg-black/40">
                {b.photoCredit}
              </span>
            )}
          </div>

          <div
            className="p-5 flex flex-col gap-3"
            style={accentColor ? { borderTop: `3px solid ${accentColor}` } : undefined}
          >
            {b.eventPeriod && (
              <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-accent text-on-accent text-[13px] font-extrabold tracking-tight">
                📅 {b.eventPeriod}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {b.badge === "partenaire" && <SpecialBadge variant="partenaire" />}
              {b.badge === "coup-de-coeur" && <SpecialBadge variant="coup-de-coeur" />}
              {b.badge === "selection" && <SpecialBadge variant="selection" />}
              {b.themes?.includes("kids-friendly") && <SpecialBadge variant="kids-friendly" />}
              {b.isAgency && <SpecialBadge variant="agence" />}
            </div>

            <h2 className="m-0 font-serif text-[22px] font-semibold leading-[1.15] tracking-[-.01em]">
              {displayName(b.name)}
            </h2>
            {subtitle && <p className="m-0 text-muted text-[14px] leading-[1.4]">{subtitle}</p>}

            {/* Repère condensé : prix · ville · horaires, façon rendu de référence. */}
            <p className="m-0 text-muted text-[13.5px] leading-[1.5] flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {price && <span className="font-semibold text-ink">{price.symbol}</span>}
              {price && <span aria-hidden>·</span>}
              <CONTACT_ICONS.MapPin size={14} weight="fill" className="shrink-0 opacity-70" aria-hidden />
              {displayCity(b.address)}
              {b.hours && (
                <>
                  <span aria-hidden>·</span>
                  <CONTACT_ICONS.Clock size={13} weight="bold" className="shrink-0 opacity-70" aria-hidden />
                  {b.hours}
                </>
              )}
            </p>

            {/* Actions rondes : Appeler / Itinéraire / Site web / WhatsApp / Email. */}
            <div className="flex flex-wrap gap-2 py-1">
              {b.phone ? (
                <CircleAction
                  href={tel(b.phone)}
                  icon={<CONTACT_ICONS.Phone size={19} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "call")}
                >
                  Appeler
                </CircleAction>
              ) : (
                <CircleAction disabled icon={<CONTACT_ICONS.Phone size={19} weight="fill" aria-hidden />}>
                  Sans tél.
                </CircleAction>
              )}
              {b.googleMapsUrl && (
                <CircleAction
                  href={b.googleMapsUrl}
                  external
                  icon={<CONTACT_ICONS.NavigationArrow size={19} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "directions")}
                >
                  Itinéraire
                </CircleAction>
              )}
              {b.website && (
                <CircleAction
                  href={b.website}
                  external
                  icon={<CONTACT_ICONS.Globe size={19} weight="bold" aria-hidden />}
                  onClick={() => trackEvent(b.id, "website")}
                >
                  {webLabel(b.website)}
                </CircleAction>
              )}
              {waNumber && (
                <CircleAction
                  href={whatsappLink(waNumber)}
                  external
                  icon={<CONTACT_ICONS.WhatsappLogo size={19} weight="fill" aria-hidden />}
                  onClick={() => trackEvent(b.id, "whatsapp")}
                >
                  WhatsApp
                </CircleAction>
              )}
              {b.email && (
                <CircleAction
                  href={`mailto:${b.email}`}
                  icon={<CONTACT_ICONS.EnvelopeSimple size={19} weight="bold" aria-hidden />}
                >
                  Email
                </CircleAction>
              )}
            </div>

            {b.description && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                <h3 className="m-0 mt-2 text-[13px] font-bold uppercase tracking-wide text-muted">À propos</h3>
                <p className={`m-0 text-ink text-[14.5px] leading-[1.6] ${descExpanded ? "" : "line-clamp-3"}`}>
                  {b.description}
                </p>
                {!descExpanded && (
                  <button
                    onClick={() => setDescExpanded(true)}
                    className="self-start text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                  >
                    Voir plus
                  </button>
                )}
              </div>
            )}

            {(facts.length > 0 ||
              b.takeaway ||
              b.themes?.some((t) => t !== "kids-friendly" && !hiddenKeys?.has(t))) && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border mt-1">
                {b.themes?.map((tKey) => {
                  if (tKey === "kids-friendly") return null;
                  if (hiddenKeys?.has(tKey)) return null;
                  const theme = SUBCATEGORIES[b.category]?.find((t) => t.key === tKey);
                  if (!theme) return null;
                  const TIcon = iconForKey(tKey);
                  return (
                    <Tag key={tKey} icon={TIcon ? <TIcon size={13} weight="bold" aria-hidden /> : theme.emoji}>
                      {theme.label}
                    </Tag>
                  );
                })}
                {facts.map((f, i) => (
                  <Tag key={i} icon={<f.Icon size={13} weight="bold" aria-hidden />}>
                    {f.label}
                  </Tag>
                ))}
                {b.takeaway && <Tag icon="🥡">À emporter</Tag>}
              </div>
            )}

            {b.promoText && (
              <p className="m-0 text-[14px] leading-[1.5] text-primary-deep border-l-2 border-primary pl-3 py-0.5">
                💬 <span className="italic">{b.promoText}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
