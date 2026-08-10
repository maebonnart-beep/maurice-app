"use client";

import type { MouseEvent, ReactNode } from "react";

type Variant = "primary" | "secondary";

/**
 * Bouton/lien d'action du design system (Appeler, Email, WhatsApp, Site, Itinéraire).
 * `primary` = plein turquoise ; `secondary` = surface bordée ; `disabled` = état grisé.
 */
export function ActionButton({
  href,
  variant = "secondary",
  icon,
  children,
  external = false,
  disabled = false,
  onClick,
}: {
  href?: string;
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
  external?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
}) {
  const base =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-body font-semibold no-underline transition-colors";
  const styles: Record<Variant, string> = {
    primary: "bg-primary border border-primary text-white hover:bg-primary-deep",
    secondary:
      "bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep",
  };

  if (disabled) {
    return (
      <span
        className={`${base} bg-surface-2 border border-border text-ink opacity-45`}
        aria-disabled="true"
      >
        {icon} {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`${base} ${styles[variant]}`}
    >
      {icon} {children}
    </a>
  );
}
