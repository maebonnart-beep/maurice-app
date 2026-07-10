export type TrackEventType = "call" | "website" | "directions" | "whatsapp";

/**
 * Records a monetizable interaction on a business fiche (e.g. "180 clics WhatsApp ce mois-ci").
 * No backend yet — logs only. Shaped to become a `business_events` insert once Supabase exists
 * (see web/supabase/schema.sql), so callers won't need to change when that swap happens.
 */
export function trackEvent(businessId: string, type: TrackEventType) {
  console.debug("[track]", { businessId, type, at: new Date().toISOString() });
}
