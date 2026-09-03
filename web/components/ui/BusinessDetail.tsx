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
import { FavoriteButton } from "./FavoriteButton";
import { SuggestPhotoButton } from "./SuggestPhotoButton";
import { SuggestCommentButton } from "./SuggestCommentButton";
import { Tag } from "./Tag";
import { metaFacts } from "./BusinessCard";
import { iconForKey, subIconFor, CONTACT_ICONS } from "@/lib/icons";
import { ArrowLeft } from "@phosphor-icons/react";

/** Au-delà de ~6 lignes affichées, on replie la description (rare : ~90% des fiches tiennent en dessous). */
const DESCRIPTION_CLAMP_THRESHOLD = 320;

/** Lien de partage WhatsApp pré-rempli, sans destinataire fixe (choisi dans l'appli). */
function whatsappShareHref(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Pas de nom de domaine propre pour l'instant : alias Vercel stable entre déploiements. */
const KOTE_MORIS_URL = "https://web-maeva26dodo.vercel.app";

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
      <span
        className={`w-full text-center text-[11.5px] font-semibold leading-tight truncate ${
          disabled ? "text-muted" : "text-ink"
        }`}
      >
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
  const photos = b.photoUrls?.length ? b.photoUrls : b.photoUrl ? [b.photoUrl] : [];
  const [photoIndex, setPhotoIndex] = useState(0);
  // Cf. BusinessCard : si la fiche correspond déjà au contexte de navigation
  // actif, on masque le sous-titre plutôt que d'en montrer un autre thème
  // (une fiche bar ET restaurant ne doit pas afficher « Restaurant » comme
  // sous-titre quand on l'ouvre depuis la rubrique « Bars »).
  const matchesActiveContext = b.themes?.some((t) => hiddenKeys?.has(t));
  const firstTheme = matchesActiveContext ? undefined : b.themes?.find((t) => t !== "kids-friendly");
  const subtitle = firstTheme ? SUBCATEGORIES[b.category]?.find((t) => t.key === firstTheme)?.label : undefined;
  const CategoryIcon = iconForKey(b.category);
  const bannerIcon = (firstTheme && subIconFor(firstTheme)) ?? subIconFor(b.category);
  const shareText = [
    displayName(b.name),
    b.address,
    b.phone,
    b.googleMapsUrl || b.website,
    `Trouvé sur Koté Moris — ${KOTE_MORIS_URL}`,
  ]
    .filter(Boolean)
    .join("\n");

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
          {/* Photo(s) plein cadre si disponibles (rare, ~1% des fiches) ; sinon bandeau
              compact avec icône illustrée, pour laisser plus de place au texte en dessous.
              object-contain (plutôt que cover) pour ne pas rogner les photos prises sur le
              terrain ; plusieurs photos → carrousel scroll-snap avec pastilles. */}
          {photos.length > 0 ? (
            <div className="relative w-full h-[260px] lg:h-[340px] bg-surface-2 shrink-0">
              <div
                className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.clientWidth > 0) setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
                }}
              >
                {photos.map((src, i) => (
                  <div key={i} className="w-full h-full shrink-0 snap-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={displayName(b.name)} className="w-full h-full object-contain" />
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                aria-label="Retour"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center backdrop-blur-sm active:scale-[.95]"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden />
              </button>
              <FavoriteButton
                id={b.id}
                size={18}
                className="absolute top-3 right-3 gap-2"
                chipClassName="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/45 text-white backdrop-blur-sm"
              />
              {(b.badge === "selection" || b.themes?.includes("kids-friendly")) && (
                <div className="absolute top-14 right-3 flex flex-col items-end gap-2">
                  {b.badge === "selection" && (
                    <SpecialBadge variant="selection" className="h-16 w-16 shrink-0 drop-shadow-md" />
                  )}
                  {b.themes?.includes("kids-friendly") && (
                    <SpecialBadge variant="kids-friendly" className="h-16 w-16 shrink-0 drop-shadow-md" />
                  )}
                </div>
              )}
              {photos.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5" aria-hidden>
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === photoIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
              {b.photoCredit && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] leading-none text-white/90 bg-black/40">
                  {b.photoCredit}
                </span>
              )}
            </div>
          ) : (
            <div
              className="relative w-full h-[110px] shrink-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--band), var(--band-deep))" }}
            >
              <button
                onClick={onClose}
                aria-label="Retour"
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/20 text-on-band flex items-center justify-center backdrop-blur-sm active:scale-[.95]"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden />
              </button>
              <FavoriteButton
                id={b.id}
                size={18}
                className="absolute top-3 right-3 gap-2"
                chipClassName="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/20 text-on-band backdrop-blur-sm"
              />
              {(b.badge === "selection" || b.themes?.includes("kids-friendly")) && (
                <div className="absolute top-14 right-3 flex flex-col items-end gap-2">
                  {b.badge === "selection" && (
                    <SpecialBadge variant="selection" className="h-16 w-16 shrink-0 drop-shadow-md" />
                  )}
                  {b.themes?.includes("kids-friendly") && (
                    <SpecialBadge variant="kids-friendly" className="h-16 w-16 shrink-0 drop-shadow-md" />
                  )}
                </div>
              )}
              <span className="w-16 h-16 rounded-full bg-surface shadow-sm flex items-center justify-center text-primary-deep overflow-hidden">
                {bannerIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bannerIcon} alt="" aria-hidden className="w-full h-full object-cover" />
                ) : (
                  CategoryIcon && <CategoryIcon size={30} weight="duotone" aria-hidden />
                )}
              </span>
            </div>
          )}

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
              {b.isAgency && <SpecialBadge variant="agence" />}
            </div>

            <h2 className="m-0 font-serif text-[22px] font-semibold leading-[1.15] tracking-[-.01em]">
              {displayName(b.name)}
            </h2>
            {subtitle && <p className="m-0 text-muted text-[14px] leading-[1.4]">{subtitle}</p>}

            {/* Liste d'infos scannable : une ligne par info, lisible d'un coup d'œil
                (plutôt qu'un paragraphe condensé) — utile faute de photo sur la fiche. */}
            <div className="flex flex-col gap-1.5 text-[13.5px] leading-[1.4]">
              {b.hours && (
                <p className="m-0 flex items-center gap-2">
                  <CONTACT_ICONS.Clock size={15} weight="bold" className="shrink-0 text-muted" aria-hidden />
                  <span>{b.hours}</span>
                </p>
              )}
              {price && (
                <p className="m-0 flex items-center gap-2">
                  <span className="shrink-0 min-w-[15px] text-center font-bold text-muted whitespace-nowrap">{price.symbol}</span>
                  <span>{price.label}</span>
                </p>
              )}
              <p className="m-0 flex items-center gap-2">
                <CONTACT_ICONS.MapPin size={15} weight="fill" className="shrink-0 text-muted" aria-hidden />
                <span>{b.address || displayCity(b.address)}</span>
              </p>
              {b.phone && (
                <p className="m-0 flex items-center gap-2">
                  <CONTACT_ICONS.Phone size={15} weight="fill" className="shrink-0 text-muted" aria-hidden />
                  <span>{b.phone}</span>
                </p>
              )}
              {b.website && (
                <p className="m-0 flex items-center gap-2">
                  <CONTACT_ICONS.Globe size={15} weight="bold" className="shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{webLabel(b.website)}</span>
                </p>
              )}
            </div>

            {/* Actions rondes : Appeler / Itinéraire / Site web / WhatsApp / Email. */}
            <div className="flex flex-wrap gap-x-2 gap-y-3 py-1">
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
              <CircleAction
                href={whatsappShareHref(shareText)}
                external
                icon={<CONTACT_ICONS.WhatsappLogo size={19} weight="fill" aria-hidden />}
                onClick={() => trackEvent(b.id, "share")}
              >
                Partager
              </CircleAction>
            </div>

            {b.description && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                <h3 className="m-0 mt-2 text-[13px] font-bold uppercase tracking-wide text-muted">À propos</h3>
                <p
                  className={`m-0 text-ink text-[14.5px] leading-[1.6] ${
                    descExpanded || b.description.length <= DESCRIPTION_CLAMP_THRESHOLD ? "" : "line-clamp-6"
                  }`}
                >
                  {b.description}
                </p>
                {!descExpanded && b.description.length > DESCRIPTION_CLAMP_THRESHOLD && (
                  <button
                    onClick={() => setDescExpanded(true)}
                    className="self-start text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                  >
                    Voir plus
                  </button>
                )}
              </div>
            )}

            {b.koteMorisComment && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                <h3 className="m-0 mt-2 text-[13px] font-bold uppercase tracking-wide text-primary-deep">
                  💬 Commentaire Koté Moris
                </h3>
                <p className="m-0 text-ink text-[14.5px] leading-[1.6] italic bg-primary-tint/40 rounded-card p-3">
                  {b.koteMorisComment}
                </p>
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

            <SuggestPhotoButton businessId={b.id} businessName={displayName(b.name)} />
            <SuggestCommentButton businessId={b.id} businessName={displayName(b.name)} />
          </div>
        </div>
      </div>
    </div>
  );
}
