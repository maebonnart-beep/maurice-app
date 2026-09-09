import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const TRACKED_TYPES = new Set(["call", "website", "directions", "whatsapp"]);

/** Enregistre un clic sur une fiche (business_events), best-effort — n'échoue jamais côté appelant. */
export async function POST(request: Request) {
  try {
    const { businessId, type } = (await request.json()) as { businessId?: string; type?: string };

    if (!businessId || !type || !TRACKED_TYPES.has(type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Exclu : les admins, pour ne pas polluer les stats avec leurs propres passages.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (profile?.is_admin) {
        return NextResponse.json({ ok: true, skipped: true });
      }
    }

    await createServiceRoleClient().from("business_events").insert({ business_id: businessId, type });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
