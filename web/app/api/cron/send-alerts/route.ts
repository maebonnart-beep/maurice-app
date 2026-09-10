import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";
import type { EventSearchCriteria, ListingSearchCriteria, SavedSearchType } from "@/lib/alerts/types";
import { notifyUserAlertMatches, type AlertMatch } from "@/lib/alerts/notifyUser";

const BUSINESSES_PATH = path.join(process.cwd(), "data", "businesses.json");

type SavedSearchRow = {
  id: number;
  user_id: string;
  type: SavedSearchType;
  label: string;
  criteria: ListingSearchCriteria | EventSearchCriteria;
  notified_ids: string[];
  reminded_ids: string[];
  last_notified_at: string | null;
  created_at: string;
};

/** Jours restants avant une date ISO (YYYY-MM-DD), arrondi au jour près. */
function daysUntil(dateStr: string, today: Date): number {
  const day0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - day0.getTime()) / 86_400_000);
}

async function matchListings(
  supabase: ReturnType<typeof createServiceRoleClient>,
  criteria: ListingSearchCriteria,
  since: string
): Promise<AlertMatch[]> {
  let query = supabase
    .from("listings")
    .select("id, title, price, zone")
    .eq("status", "approved")
    .gt("created_at", since);

  if (criteria.category) query = query.eq("category", criteria.category);
  if (criteria.zone) query = query.eq("zone", criteria.zone);
  if (criteria.maxPrice) query = query.lte("price", criteria.maxPrice);
  if (criteria.keyword) query = query.ilike("title", `%${criteria.keyword}%`);

  const { data } = await query;
  return (data ?? []).map((l) => ({
    title: l.title as string,
    href: `/seconde-main/${l.id}`,
    subtitle: l.price ? `Rs ${(l.price as number).toLocaleString("fr-FR")}` : undefined,
  }));
}

function matchesEventCriteria(b: Business, criteria: EventSearchCriteria): boolean {
  if (b.category !== "agenda") return false;
  const themes = b.themes ?? [];
  const filters = b.filters ?? [];
  if (criteria.themes && criteria.themes.length > 0 && !criteria.themes.some((t) => themes.includes(t))) {
    return false;
  }
  if (criteria.filters && criteria.filters.length > 0 && !criteria.filters.some((f) => filters.includes(f))) {
    return false;
  }
  if (criteria.keyword) {
    const haystack = `${b.name} ${b.description ?? ""} ${b.address}`.toLowerCase();
    if (!haystack.includes(criteria.keyword.toLowerCase())) return false;
  }
  return true;
}

/** Événements : un email à la création de la fiche (diff d'IDs, pas de created_at fiable),
 *  et un second à J-7 (ou moins) pour les fiches dont la date exacte est connue — suivi
 *  séparément via reminded_ids pour ne jamais doubler l'envoi. */
async function matchEvents(
  criteria: EventSearchCriteria,
  alreadyNotified: Set<string>,
  alreadyReminded: Set<string>
) {
  const raw = await fs.readFile(BUSINESSES_PATH, "utf8");
  const businesses = JSON.parse(raw) as Business[];
  const today = new Date();

  const newMatches = businesses.filter((b) => matchesEventCriteria(b, criteria) && !alreadyNotified.has(b.id));
  const newIds = new Set(newMatches.map((b) => b.id));

  const reminderMatches = businesses.filter((b) => {
    if (!matchesEventCriteria(b, criteria)) return false;
    if (alreadyReminded.has(b.id) || newIds.has(b.id)) return false;
    if (!b.eventStartDate) return false;
    const d = daysUntil(b.eventStartDate, today);
    return d >= 0 && d <= 7;
  });

  const toAlertMatch = (b: Business): AlertMatch => ({ title: b.name, subtitle: b.period ?? b.eventPeriod });

  return {
    alertMatches: newMatches.map(toAlertMatch),
    newIds: [...newIds],
    reminderMatches: reminderMatches.map(toAlertMatch),
    newRemindedIds: reminderMatches.map((b) => b.id),
  };
}

/** Appelée par le cron Vercel (voir vercel.json) : envoie un email pour chaque alerte
 *  ayant de nouveaux résultats depuis son dernier envoi. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: alerts, error } = await supabase.from("saved_searches").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;

  for (const alert of (alerts ?? []) as SavedSearchRow[]) {
    const since = alert.last_notified_at ?? alert.created_at;
    let matches: AlertMatch[] = [];
    let reminders: AlertMatch[] = [];
    let newNotifiedIds: string[] | null = null;
    let newRemindedIds: string[] | null = null;

    if (alert.type === "listing") {
      matches = await matchListings(supabase, alert.criteria as ListingSearchCriteria, since);
    } else {
      const result = await matchEvents(
        alert.criteria as EventSearchCriteria,
        new Set(alert.notified_ids ?? []),
        new Set(alert.reminded_ids ?? [])
      );
      matches = result.alertMatches;
      reminders = result.reminderMatches;
      newNotifiedIds = [...(alert.notified_ids ?? []), ...result.newIds];
      newRemindedIds = [...(alert.reminded_ids ?? []), ...result.newRemindedIds];
    }

    if (matches.length === 0 && reminders.length === 0) continue;

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(alert.user_id);
    if (!user?.email) continue;

    await notifyUserAlertMatches({
      toEmail: user.email,
      alertLabel: alert.label,
      type: alert.type,
      matches,
      reminders,
    });

    await supabase
      .from("saved_searches")
      .update({
        last_notified_at: new Date().toISOString(),
        ...(newNotifiedIds ? { notified_ids: newNotifiedIds } : {}),
        ...(newRemindedIds ? { reminded_ids: newRemindedIds } : {}),
      })
      .eq("id", alert.id);

    sent += 1;
  }

  return NextResponse.json({ ok: true, alertsChecked: alerts?.length ?? 0, emailsSent: sent });
}
