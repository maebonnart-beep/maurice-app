import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_LIST_LIMIT, LIST_COLUMNS, LIST_LIMITS } from "@/lib/favoriteLists";

/** Listes illimitées : abonnés premium, contributeurs (communauté) et admins. */
function hasUnlimitedLists(
  profile: { subscription_status?: string | null; is_admin?: boolean | null; is_community_member?: boolean | null } | null
) {
  return profile?.subscription_status === "active" || !!profile?.is_admin || !!profile?.is_community_member;
}

/** Nettoie un champ texte optionnel : trim, coupe à `max`, vide → null. */
function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

/** Listes personnalisées de l'utilisateur connecté (+ `unlimited`, pour la limite gratuite). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const [{ data, error }, { data: profile }] = await Promise.all([
    supabase
      .from("favorite_lists")
      .select(LIST_COLUMNS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("profiles").select("subscription_status, is_admin, is_community_member").eq("id", user.id).single(),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lists: data, unlimited: hasUnlimitedLists(profile) });
}

/** Création d'une liste — FREE_LIST_LIMIT listes par défaut, illimité pour premium/contributeurs/admins. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("subscription_status, is_admin, is_community_member").eq("id", user.id).single(),
    supabase.from("favorite_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  if (!hasUnlimitedLists(profile) && (count ?? 0) >= FREE_LIST_LIMIT) {
    return NextResponse.json(
      { error: `Tu as atteint tes ${FREE_LIST_LIMIT} listes gratuites : passe premium pour en créer d'autres.` },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    emoji?: string;
    period?: string;
    addBusinessId?: string;
  };
  const name = optionalText(body.name, LIST_LIMITS.name);

  if (!name) {
    return NextResponse.json({ error: "Donne un nom à ta liste." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorite_lists")
    .insert({
      user_id: user.id,
      name,
      description: optionalText(body.description, LIST_LIMITS.description),
      emoji: optionalText(body.emoji, LIST_LIMITS.emoji),
      period: optionalText(body.period, LIST_LIMITS.period),
      business_ids: typeof body.addBusinessId === "string" && body.addBusinessId ? [body.addBusinessId] : [],
    })
    .select(LIST_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, list: data });
}
