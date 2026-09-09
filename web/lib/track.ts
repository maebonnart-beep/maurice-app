export type TrackEventType = "call" | "website" | "directions" | "whatsapp" | "share";

// "share" n'a pas de colonne dédiée dans business_events (cf. schema.sql) : pas encore remonté.
const TRACKED_TYPES = new Set<TrackEventType>(["call", "website", "directions", "whatsapp"]);

/**
 * Records a monetizable interaction on a business fiche (e.g. "180 clics WhatsApp ce mois-ci").
 * Best-effort, fire-and-forget : ne bloque jamais le clic (lien tel:/whatsapp/site déjà ouvert
 * par le href) et n'échoue jamais visiblement si la requête échoue.
 */
export function trackEvent(businessId: string, type: TrackEventType) {
  if (!TRACKED_TYPES.has(type)) return;
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, type }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignoré : le suivi ne doit jamais gêner l'action de l'utilisateur.
  }
}
