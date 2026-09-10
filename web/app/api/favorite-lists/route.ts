import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Listes de favoris nommées de l'utilisateur connecté. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("favorite_lists")
    .select("id, name, business_ids, share_token, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** Création d'une liste nommée — réservé aux comptes premium. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_status !== "active") {
    return NextResponse.json(
      { error: "Un abonnement premium actif est requis pour créer une liste." },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "name est requis." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorite_lists")
    .insert({ user_id: user.id, name })
    .select("id, name, business_ids, share_token, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, list: data });
}
