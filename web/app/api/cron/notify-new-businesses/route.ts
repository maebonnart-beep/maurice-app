import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";
import { notifyNewBusinesses, type AlertMatch } from "@/lib/alerts/notifyUser";

const BUSINESSES_PATH = path.join(process.cwd(), "data", "businesses.json");

/** Fiches candidates : hors agenda (événements, déjà couverts par send-alerts) et avec un createdAt stampé. */
function candidateBusinesses(businesses: Business[]): Business[] {
  return businesses.filter((b) => b.category !== "agenda" && !!b.createdAt);
}

/** Appelée par le cron Vercel (voir vercel.json) : notifie les comptes premium par
 *  e-mail des nouvelles fiches annuaire ajoutées depuis le dernier run (suivi global
 *  via notified_businesses, pas par utilisateur). */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const raw = await fs.readFile(BUSINESSES_PATH, "utf8");
  const businesses = candidateBusinesses(JSON.parse(raw) as Business[]);

  const { data: alreadyNotified, error: notifiedError } = await supabase
    .from("notified_businesses")
    .select("business_id");
  if (notifiedError) {
    return NextResponse.json({ error: notifiedError.message }, { status: 500 });
  }
  const notifiedIds = new Set((alreadyNotified ?? []).map((r) => r.business_id as string));

  const newOnes = businesses.filter((b) => !notifiedIds.has(b.id));
  if (newOnes.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 });
  }

  const { data: premiumProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("subscription_status", "active");
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const matches: AlertMatch[] = newOnes.map((b) => ({ title: b.name, subtitle: b.address }));

  let sent = 0;
  for (const profile of premiumProfiles ?? []) {
    const {
      data: { user },
    } = await supabase.auth.admin.getUserById(profile.id as string);
    if (!user?.email) continue;

    await notifyNewBusinesses(user.email, matches);
    sent += 1;
  }

  await supabase
    .from("notified_businesses")
    .upsert(newOnes.map((b) => ({ business_id: b.id })));

  return NextResponse.json({ ok: true, newBusinesses: newOnes.length, emailsSent: sent });
}
