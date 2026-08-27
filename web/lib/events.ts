import type { Business } from "./types";

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
