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
      className="relative flex flex-col items-center text-center rounded-tile bg-surface border border-border shadow-sm active:scale-[.98] transition-transform pb-4"
    >
      {locked && (
        <span
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-ink"
          style={{ background: "var(--accent)" }}
        >
          🔒 PREMIUM
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
        className="relative -mt-6 w-12 h-12 rounded-full flex items-center justify-center text-on-band border-4 border-surface shadow-sm"
        style={{ background: "var(--band)" }}
      >
        {Icon && <Icon size={22} weight="bold" aria-hidden />}
      </span>
      <span className="mt-2 px-2 text-[15px] font-bold leading-tight text-primary-deep">{label}</span>
      <span className="mt-1 px-3 text-[11.5px] leading-snug text-muted">{subtitle}</span>
    </button>
  );
}
