import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Préférences de personnalisation (rubriques d'intérêt + enfants) de
 * l'utilisateur connecté, sauvegardées côté Supabase en complément du localStorage. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();
  const prefs = (data?.preferences as { interests?: string[]; hasKids?: boolean }) ?? {};

  return NextResponse.json({
    interests: Array.isArray(prefs.interests) ? prefs.interests : [],
    hasKids: prefs.hasKids === true,
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

  const body = (await request.json()) as { interests?: string[]; hasKids?: boolean };

  if (!Array.isArray(body.interests)) {
    return NextResponse.json({ error: "interests est requis." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: { interests: body.interests, hasKids: body.hasKids === true } })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
