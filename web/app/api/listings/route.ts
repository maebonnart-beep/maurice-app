import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_ACTIVE_LISTINGS } from "@/lib/marketplace/constants";
import { LISTING_CATEGORIES, type ListingCategoryKey } from "@/lib/marketplace/types";
import { notifyAdminNewListing } from "@/lib/marketplace/notifyAdmin";

/** Annonces de l'utilisateur connecté (tous statuts). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** Dépôt d'une nouvelle annonce (statut initial: pending). */
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
      { error: "Un abonnement premium actif est requis pour déposer une annonce." },
      { status: 403 }
    );
  }

  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"]);

  if ((count ?? 0) >= MAX_ACTIVE_LISTINGS) {
    return NextResponse.json(
      { error: `Limite de ${MAX_ACTIVE_LISTINGS} annonces actives atteinte.` },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    title: string;
    description?: string;
    price?: number;
    category: ListingCategoryKey;
    whatsapp: string;
    zone?: string;
  };

  if (!body.title || !body.category || !body.whatsapp) {
    return NextResponse.json(
      { error: "title, category et whatsapp sont requis." },
      { status: 400 }
    );
  }

  if (!LISTING_CATEGORIES.some((c) => c.key === body.category)) {
    return NextResponse.json({ error: "Catégorie invalide." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      price: body.price,
      category: body.category,
      whatsapp: body.whatsapp,
      zone: body.zone,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await notifyAdminNewListing(data);

  return NextResponse.json({ ok: true, listing: data });
}
