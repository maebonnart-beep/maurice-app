import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { LISTING_CATEGORIES, type ListingCategoryKey } from "@/lib/marketplace/types";

/** Modification du contenu d'une annonce par l'admin (toute annonce, tout statut). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await params;
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

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      title: body.title,
      description: body.description ?? null,
      price: body.price ?? null,
      category: body.category,
      whatsapp: body.whatsapp,
      zone: body.zone ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: data });
}

/** Suppression définitive d'une annonce par l'admin (photos storage + lignes liées). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, listing_photos(storage_path)")
    .eq("id", id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const photos = (listing.listing_photos as { storage_path: string }[] | null) ?? [];
  if (photos.length > 0) {
    await supabase.storage.from("listing-photos").remove(photos.map((p) => p.storage_path));
  }

  await supabase.from("listing_events").delete().eq("listing_id", id);
  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
