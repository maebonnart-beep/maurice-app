import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { LISTING_CATEGORIES, type ListingCategoryKey } from "@/lib/marketplace/types";

/** Annonce du propriétaire connecté, avec ses photos. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  return NextResponse.json(data);
}

/** Modification par le propriétaire : repasse l'annonce en attente de modération
 * (toute annonce approuvée/refusée modifiée redemande une validation admin). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
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
    .update({
      title: body.title,
      description: body.description ?? null,
      price: body.price ?? null,
      category: body.category,
      whatsapp: body.whatsapp,
      zone: body.zone ?? null,
      status: "pending",
      rejection_reason: null,
      approved_at: null,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: data });
}

/** Suppression par le propriétaire. La table `listings` n'a pas de grant DELETE
 * pour `authenticated` (pas prévu à la création du schéma) : on vérifie donc la
 * propriété avec le client session, puis on supprime via la clé service-role. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, listing_photos(storage_path)")
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const photos = (listing.listing_photos as { storage_path: string }[] | null) ?? [];
  if (photos.length > 0) {
    await admin.storage.from("listing-photos").remove(photos.map((p) => p.storage_path));
  }

  await admin.from("listing_events").delete().eq("listing_id", id);
  const { error } = await admin.from("listings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
