import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SavedSearchCriteria, SavedSearchType } from "@/lib/alerts/types";
import { describeCriteria } from "@/lib/alerts/label";

/** Alertes de l'utilisateur connecté. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** Création d'une alerte à partir de critères (annonces ou événements). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const body = (await request.json()) as {
    type: SavedSearchType;
    criteria: SavedSearchCriteria;
  };

  if (body.type !== "listing" && body.type !== "event") {
    return NextResponse.json({ error: "type invalide." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      user_id: user.id,
      type: body.type,
      criteria: body.criteria ?? {},
      label: describeCriteria(body.type, body.criteria ?? {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alert: data });
}
