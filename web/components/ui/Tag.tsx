import type { ReactNode } from "react";

/**
 * Petite puce bordée du design system — utilisée pour les thèmes, la gamme de
 * prix, les meta-facts (distance, durée…) et « à emporter ».
 */
export function Tag({
  icon,
  children,
  className = "",
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-meta font-semibold border border-border bg-surface-2 text-muted ${className}`}
    >
      {icon != null && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
