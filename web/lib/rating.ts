import type { Business, KoteMorisRatings } from "@/lib/types";

/**
 * Classement Koté Moris : grille éditoriale notée à la main (1-5 par critère).
 * Aucune note Google/TripAdvisor n'entre dans le calcul (leurs CGU interdisent
 * de stocker ou réutiliser leurs notes) — elles peuvent seulement servir de
 * repère lors de la notation manuelle.
 */
export const RATING_CRITERIA: { key: keyof KoteMorisRatings; label: string; weight: number }[] = [
  { key: "gout", label: "Goût / qualité", weight: 0.35 },
  { key: "qualitePrix", label: "Rapport qualité-prix", weight: 0.25 },
  { key: "accueil", label: "Accueil / service", weight: 0.15 },
  { key: "cadre", label: "Cadre / ambiance", weight: 0.15 },
  { key: "regularite", label: "Régularité", weight: 0.1 },
];

/** Rubriques couvertes par la grille (pensée pour la restauration). */
export const RATED_THEMES = ["restaurants", "cafes-bars-glaciers"];

/** Score minimal (sur 100) pour chaque niveau affiché. En dessous : niveau 1, interne seulement. */
export const LEVEL_THRESHOLDS = { 3: 85, 2: 70 } as const;

export type KoteMorisLevel = 0 | 1 | 2 | 3;

/** Libellés des niveaux affichés (infobulle / lecteur d'écran — visuellement on ne montre que des fleurs). */
export const LEVEL_LABELS: Record<2 | 3, string> = {
  3: "Incontournable Koté Moris",
  2: "Recommandé par Koté Moris",
};

/** Moyenne pondérée des critères renseignés, ramenée sur 100 (1 → 0, 5 → 100). Null si rien n'est noté. */
export function scoreFromRatings(ratings?: KoteMorisRatings): number | null {
  if (!ratings) return null;
  let total = 0;
  let weights = 0;
  for (const c of RATING_CRITERIA) {
    const note = ratings[c.key];
    if (typeof note !== "number" || note < 1 || note > 5) continue;
    total += ((note - 1) / 4) * 100 * c.weight;
    weights += c.weight;
  }
  return weights > 0 ? Math.round(total / weights) : null;
}

export function levelFromScore(score: number | null): KoteMorisLevel {
  if (score === null) return 0;
  if (score >= LEVEL_THRESHOLDS[3]) return 3;
  if (score >= LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

export function koteMorisScore(b: Business): number | null {
  return scoreFromRatings(b.koteMorisRatings);
}

export function koteMorisLevel(b: Business): KoteMorisLevel {
  return levelFromScore(koteMorisScore(b));
}
