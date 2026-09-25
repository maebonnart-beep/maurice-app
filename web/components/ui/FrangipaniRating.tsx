import { LEVEL_LABELS, type KoteMorisLevel } from "@/lib/rating";

// Pétale large et arrondi, légèrement déporté (le frangipanier a des pétales qui se chevauchent en hélice).
const PETAL = "M12 12C7.6 10.4 6.4 4.2 10.6 1.6C14.6 0.6 16.6 5.2 12 12Z";

/** Fleur de frangipanier (5 pétales + cœur jaune), dessinée en SVG pour suivre le thème. */
export function FrangipaniFlower({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      {[0, 72, 144, 216, 288].map((angle) => (
        <path key={angle} d={PETAL} fill="currentColor" transform={`rotate(${angle} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

/**
 * Niveau Koté Moris en fleurs de frangipanier : 3 = incontournable, 2 = recommandé.
 * Le niveau 1 (et les fiches non notées) n'affiche rien — il ne sert qu'au tri.
 */
export function FrangipaniRating({
  level,
  size = 14,
  className,
}: {
  level: KoteMorisLevel;
  size?: number;
  className?: string;
}) {
  if (level < 2) return null;
  const label = LEVEL_LABELS[level as 2 | 3];
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={className ?? "inline-flex items-center gap-px shrink-0 text-primary"}
    >
      {Array.from({ length: level }, (_, i) => (
        <FrangipaniFlower key={i} size={size} />
      ))}
    </span>
  );
}
