"use client";

import type { ReactNode } from "react";

/** Puce ronde de filtre (zones, toggle Liste/Carte) avec état actif/inactif. */
export function FilterChip({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-body font-medium whitespace-nowrap shrink-0 transition-colors ${
        active
          ? "bg-primary border-primary text-white"
          : "bg-surface border-border text-ink hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}
