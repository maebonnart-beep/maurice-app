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
  last_notified_at: string | null;
  created_at: string;
};

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

async function matchEvents(criteria: EventSearchCriteria, alreadyNotified: Set<string>) {
  const raw = await fs.readFile(BUSINESSES_PATH, "utf8");
  const businesses = JSON.parse(raw) as Business[];

  const matches = businesses.filter((b) => {
    if (b.category !== "agenda") return false;
    if (alreadyNotified.has(b.id)) return false;
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
  });

  const alertMatches: AlertMatch[] = matches.map((b) => ({
    title: b.name,
    subtitle: b.period ?? b.eventPeriod,
  }));

  return { alertMatches, newIds: matches.map((b) => b.id) };
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
    let newNotifiedIds: string[] | null = null;

    if (alert.type === "listing") {
      matches = await matchListings(supabase, alert.criteria as ListingSearchCriteria, since);
    } else {
      const { alertMatches, newIds } = await matchEvents(
        alert.criteria as EventSearchCriteria,
        new Set(alert.notified_ids ?? [])
      );
      matches = alertMatches;
      newNotifiedIds = [...(alert.notified_ids ?? []), ...newIds];
    }

    if (matches.length === 0) continue;

    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(alert.user_id);
    if (!user?.email) continue;

    await notifyUserAlertMatches({
      toEmail: user.email,
      alertLabel: alert.label,
      type: alert.type,
      matches,
    });

    await supabase
      .from("saved_searches")
      .update({
        last_notified_at: new Date().toISOString(),
        ...(newNotifiedIds ? { notified_ids: newNotifiedIds } : {}),
      })
      .eq("id", alert.id);

    sent += 1;
  }

  return NextResponse.json({ ok: true, alertsChecked: alerts?.length ?? 0, emailsSent: sent });
}
