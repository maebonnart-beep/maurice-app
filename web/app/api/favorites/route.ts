import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Favoris (statuts par fiche + sélections KM) de l'utilisateur connecté,
 * sauvegardés côté Supabase en complément du localStorage. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_favorites")
    .select("statuses, selection_ids")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    statuses: (data?.statuses as Record<string, string>) ?? {},
    selectionIds: (data?.selection_ids as string[]) ?? [],
  });
}

/** Écrase la sauvegarde distante avec l'état local courant (fusion faite côté client). */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const body = (await request.json()) as {
    statuses?: Record<string, string>;
    selectionIds?: string[];
  };

  if (typeof body.statuses !== "object" || body.statuses === null || !Array.isArray(body.selectionIds)) {
    return NextResponse.json({ error: "statuses et selectionIds sont requis." }, { status: 400 });
  }

  const { error } = await supabase.from("user_favorites").upsert({
    user_id: user.id,
    statuses: body.statuses,
    selection_ids: body.selectionIds,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
