import type { Business } from "./types";

/** Couleur par type d'événement (filtre), pour distinguer visuellement concerts / sport / associatif / etc. */
export const EVENT_TYPE_COLOR: Record<string, string> = {
  concert: "#a855f7",
  festival: "#f97316",
  "spectacle-comedie": "#ec4899",
  "clubbing-soiree": "#6366f1",
  "culturel-traditionnel": "#eab308",
  sportif: "#22c55e",
  "associatif-caritatif": "#0ea5e9",
  culinaire: "#ef4444",
};
export const DEFAULT_EVENT_COLOR = "#e0518a";

/** Couleur d'un événement : celle de son premier filtre de type reconnu, sinon la couleur par défaut. */
export function eventColorFor(b: Business): string {
  return (b.filters || []).map((f) => EVENT_TYPE_COLOR[f]).find(Boolean) ?? DEFAULT_EVENT_COLOR;
}

/** Date d'un événement mise en forme pour affichage (ex. "ven. 5 sept."), ou null si absente. */
export function formatEventDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
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

/** Comparateur de tri chronologique : fiches avec eventStartDate d'abord (ascendant), puis le reste (ordre stable). */
export function compareByEventDate(a: Business, b: Business): number {
  const da = a.eventStartDate;
  const db = b.eventStartDate;
  if (da && db) return da.localeCompare(db);
  if (da) return -1;
  if (db) return 1;
  return 0;
}
