import type { Business, KoteMorisRatings } from "@/lib/types";
import { highlightedFromRatings } from "@/lib/rating";

// Pétale large et arrondi, légèrement déporté (le frangipanier a des pétales qui se chevauchent en hélice).
const PETAL = "M12 12C7.6 10.4 6.4 4.2 10.6 1.6C14.6 0.6 16.6 5.2 12 12Z";

/** Fleur de frangipanier (5 pétales + cœur jaune), dessinée en SVG pour suivre le thème. */
export function FrangipaniFlower({
  size = 14,
  color = "currentColor",
  stroke,
}: {
  size?: number;
  color?: string;
  stroke?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d={PETAL}
          fill={color}
          stroke={stroke}
          strokeWidth={stroke ? 1 : undefined}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

export const ESTIMATION_NOTE = "d'après les avis en ligne";

/**
 * Critères soulignés par Koté Moris : une fleur de couleur par critère noté 5/5
 * (goût, qualité-prix, cadre, accueil). Rien si aucun critère ne se distingue.
 * Le libellé (aria-label + infobulle) nomme les critères, la couleur seule ne suffisant pas.
 */
export function CriteriaFlowers({
  business,
  ratings,
  source,
  size = 14,
  withLabels = false,
  className,
}: {
  business?: Pick<Business, "koteMorisRatings" | "koteMorisRatingsSource">;
  /** Notes directes (aperçu admin) — sinon lues sur `business`. */
  ratings?: KoteMorisRatings;
  source?: Business["koteMorisRatingsSource"];
  size?: number;
  withLabels?: boolean;
  className?: string;
}) {
  const criteria = highlightedFromRatings(ratings ?? business?.koteMorisRatings);
  if (criteria.length === 0) return null;
  const estimated = (source ?? business?.koteMorisRatingsSource) === "estimation";
  const label =
    `Souligné par Koté Moris : ${criteria.map((c) => c.label).join(", ")}` +
    (estimated ? ` (${ESTIMATION_NOTE})` : "");

  if (withLabels) {
    return (
      <span role="img" aria-label={label} title={label} className={className ?? "inline-flex flex-wrap items-center gap-x-3 gap-y-1"}>
        {criteria.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1 text-xs font-semibold text-ink" aria-hidden>
            <FrangipaniFlower size={size} color={c.color} stroke={c.stroke} />
            {c.label}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} title={label} className={className ?? "inline-flex items-center gap-0.5 shrink-0"}>
      {criteria.map((c) => (
        <FrangipaniFlower key={c.key} size={size} color={c.color} stroke={c.stroke} />
      ))}
    </span>
  );
}
