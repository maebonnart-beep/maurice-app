import type { Business } from "./types";

/** Couleur par type d'événement (filtre), pour distinguer visuellement concerts / sport / associatif / etc. */
export const EVENT_TYPE_COLOR: Record<string, string> = {
  concert: "#a855f7",
  festival: "#f97316",
  "spectacle-comedie": "#ec4899",
  "clubbing-soiree": "#6366f1",
  "culturel-traditionnel": "#eab308",
  "associatif-caritatif": "#0ea5e9",
  culinaire: "#ef4444",
};
export const SPORT_EVENT_COLOR = "#22c55e";
export const DEFAULT_EVENT_COLOR = "#e0518a";

/** Couleur d'un événement : verte pour toute la rubrique "Événements sportifs" (quelle que soit sa nature),
 * sinon celle de son premier filtre de type reconnu, sinon la couleur par défaut. */
export function eventColorFor(b: Business): string {
  if ((b.themes || []).includes("evenements-sportifs")) return SPORT_EVENT_COLOR;
  return (b.filters || []).map((f) => EVENT_TYPE_COLOR[f]).find(Boolean) ?? DEFAULT_EVENT_COLOR;
}

/** Date d'un événement mise en forme pour affichage (ex. "ven. 5 sept."), ou null si absente. */
export function formatEventDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const MONTH_NAMES = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Mois (0-11) déduit du texte libre `period` (ex. "Janvier–février" → janvier, "Fin novembre" → novembre), ou null si aucun mois n'y est cité. */
export function approxMonthFromPeriod(period: string | undefined): number | null {
  if (!period) return null;
  const lower = period.toLowerCase();
  for (let i = 0; i < 12; i++) {
    if (lower.includes(MONTH_NAMES[i])) return i;
  }
  if (lower.includes("fin d'année") || lower.includes("fin de l'année")) return 11;
  if (lower.includes("début d'année") || lower.includes("début de l'année")) return 0;
  return null;
}

/** Libellé de bandeau d'une fiche agenda : date précise si connue, sinon mois approximatif (déduit de `period`), sinon null. */
export function eventBannerLabel(b: Business): string | null {
  if (b.category !== "agenda") return null;
  const exact = formatEventDate(b.eventStartDate);
  if (exact) return exact;
  const month = approxMonthFromPeriod(b.period);
  if (month === null) return null;
  const label = MONTH_NAMES[month];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Vrai uniquement pour un événement ponctuel dont la date est confirmée passée. */
export function isPastEvent(b: Business, today: Date = new Date()): boolean {
  if (b.eventRecurrence !== "ponctuel") return false;
  const endStr = b.eventEndDate || b.eventStartDate;
  if (!endStr) return false;
  const end = new Date(endStr + "T23:59:59");
  return end.getTime() < today.getTime();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Date utilisée pour le tri chronologique d'une fiche agenda : la date exacte si connue,
 * sinon le 15 du mois approximatif (déduit de `period`) — projeté sur l'année suivante si
 * ce mois est déjà passé cette année, pour que les événements récurrents sans date exacte
 * s'intercalent à la bonne place parmi ceux déjà datés plutôt que de finir en vrac derrière.
 */
export function sortDateFor(b: Business, today: Date = new Date()): Date | null {
  if (b.eventStartDate) return new Date(b.eventStartDate + "T00:00:00");
  const month = approxMonthFromPeriod(b.period);
  if (month === null) return null;
  const day0 = startOfDay(today);
  let d = new Date(today.getFullYear(), month, 15);
  if (d.getTime() < day0.getTime()) d = new Date(today.getFullYear() + 1, month, 15);
  return d;
}

/** Comparateur de tri chronologique (cf. `sortDateFor`) : fiches datées (exactement ou approximativement) d'abord, ordre ascendant ; le reste ensuite. */
export function compareByEventDate(a: Business, b: Business, today: Date = new Date()): number {
  const da = sortDateFor(a, today);
  const db = sortDateFor(b, today);
  if (da && db) return da.getTime() - db.getTime();
  if (da) return -1;
  if (db) return 1;
  return 0;
}
