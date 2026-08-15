"use client";

import { iconForKey } from "@/lib/icons";

/**
 * Carte univers (accueil « Explorer par catégorie ») : photo en haut, badge
 * icône rond qui chevauche le bas de la photo, titre + sous-titre en dessous.
 * Format calé sur le rendu de référence de la cliente.
 */
export function UniversCard({
  photoKey,
  label,
  subtitle,
  locked,
  onClick,
}: {
  photoKey: string;
  label: string;
  subtitle: string;
  locked?: boolean;
  onClick: () => void;
}) {
  const Icon = iconForKey(photoKey);

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center text-center rounded-tile bg-surface border border-border shadow-sm active:scale-[.98] transition-transform pb-2.5"
    >
      {locked && (
        <span
          className="absolute top-1 right-1 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] text-ink"
          style={{ background: "var(--accent)" }}
          aria-label="Premium"
        >
          🔒
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/photo-univers-${photoKey}.png`}
        alt=""
        aria-hidden
        className="w-full aspect-[3/4] object-cover"
        style={{ borderTopLeftRadius: "var(--radius-tile)", borderTopRightRadius: "var(--radius-tile)" }}
      />
      <span
        className="relative -mt-4 w-8 h-8 rounded-full flex items-center justify-center text-on-band border-[3px] border-surface shadow-sm shrink-0"
        style={{ background: "var(--band)" }}
      >
        {Icon && <Icon size={15} weight="bold" aria-hidden />}
      </span>
      <span className="mt-1 px-1 text-[11px] font-bold leading-tight text-primary-deep">{label}</span>
      <span className="mt-0.5 px-1.5 text-[9.5px] leading-snug text-muted line-clamp-2">{subtitle}</span>
    </button>
  );
}
