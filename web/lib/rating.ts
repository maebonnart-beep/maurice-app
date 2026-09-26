import type { Business, KoteMorisRatings } from "@/lib/types";

/**
 * Classement Koté Moris : grille éditoriale notée à la main (1-5 par critère).
 * Aucune note Google/TripAdvisor n'entre dans le calcul (leurs CGU interdisent
 * de stocker ou réutiliser leurs notes) — elles peuvent seulement servir de
 * repère lors de la notation manuelle.
 */
export const RATING_CRITERIA: { key: keyof KoteMorisRatings; label: string; weight: number }[] = [
  { key: "gout", label: "Goût / qualité de la nourriture", weight: 0.35 },
  { key: "qualitePrix", label: "Qualité-prix", weight: 0.25 },
  { key: "cadre", label: "Cadre", weight: 0.15 },
  { key: "accueil", label: "Accueil et service", weight: 0.15 },
];

/**
 * Affichage public : une fleur de frangipanier par critère, chacun sa couleur
 * (tokens --flower-* dans globals.css), montrée seulement quand le critère
 * mérite d'être souligné (note = HIGHLIGHT_NOTE).
 */
export const FLOWER_CRITERIA: { key: keyof KoteMorisRatings; label: string; color: string; stroke: string }[] = [
  { key: "gout", label: "Goût", color: "var(--flower-gout)", stroke: "var(--flower-gout-stroke)" },
  { key: "qualitePrix", label: "Qualité-prix", color: "var(--flower-qualite-prix)", stroke: "var(--flower-qualite-prix-stroke)" },
  { key: "cadre", label: "Cadre", color: "var(--flower-cadre)", stroke: "var(--flower-cadre-stroke)" },
  { key: "accueil", label: "Accueil et service", color: "var(--flower-accueil)", stroke: "var(--flower-accueil-stroke)" },
];

export const HIGHLIGHT_NOTE = 5;

export type FlowerCriterion = (typeof FLOWER_CRITERIA)[number];

/** Critères soulignés (notés HIGHLIGHT_NOTE), dans l'ordre d'affichage. Vide si rien n'est noté. */
export function highlightedFromRatings(ratings?: KoteMorisRatings): FlowerCriterion[] {
  if (!ratings) return [];
  return FLOWER_CRITERIA.filter((c) => ratings[c.key] === HIGHLIGHT_NOTE);
}

export function highlightedCriteria(b: Business): FlowerCriterion[] {
  return highlightedFromRatings(b.koteMorisRatings);
}

/** Rubriques couvertes par la grille (pensée pour la restauration). */
export const RATED_THEMES = ["restaurants", "cafes-bars-glaciers"];

/**
 * Score/niveau global : ne sert plus qu'au tri (liste, /mon-plan) — l'affichage
 * public passe par les fleurs par critère ci-dessus.
 * Score minimal (sur 100) pour chaque niveau. En dessous : niveau 1.
 */
export const LEVEL_THRESHOLDS = { 3: 85, 2: 70 } as const;

export type KoteMorisLevel = 0 | 1 | 2 | 3;

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

/** Niveau maximal atteignable par une note simplement estimée (avis publics, lieu pas encore testé). */
export const ESTIMATION_MAX_LEVEL: KoteMorisLevel = 2;

/**
 * Niveau de tri d'une fiche (non affiché) :
 * - notes estimées (koteMorisRatingsSource "estimation") → plafonnées au niveau 2 ;
 * - notes éditoriales / issues d'une visite → niveau calculé sans plafond.
 * Le badge « Sélection » ne s'utilise plus pour la restauration (2026-09-26) : les
 * anciennes reco KM food sont passées à 5/5 sur les 4 critères (4 fleurs).
 */
export function levelFor(score: number | null, opts: { source?: Business["koteMorisRatingsSource"] }): KoteMorisLevel {
  const level = levelFromScore(score);
  if (opts.source === "estimation" && level > ESTIMATION_MAX_LEVEL) return ESTIMATION_MAX_LEVEL;
  return level;
}

export function koteMorisLevel(b: Business): KoteMorisLevel {
  return levelFor(koteMorisScore(b), { source: b.koteMorisRatingsSource });
}

/**
 * Reco de la rédaction : badge « Sélection » (hors restauration) ou, pour la
 * restauration, les 4 critères à 5/5 en note éditoriale (pas une estimation).
 */
export function isEditorialPick(b: Business): boolean {
  if (b.badge === "selection") return true;
  const r = b.koteMorisRatings;
  return (
    b.koteMorisRatingsSource !== "estimation" &&
    !!r &&
    FLOWER_CRITERIA.every((c) => r[c.key] === HIGHLIGHT_NOTE)
  );
}

/** Le badge « Sélection » est réservé aux fiches hors restauration (visites, activités…). */
export function selectionBadgeAllowed(themes?: string[]): boolean {
  return !themes?.some((t) => RATED_THEMES.includes(t));
}
