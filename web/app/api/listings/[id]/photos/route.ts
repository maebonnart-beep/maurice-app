import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LISTING_PHOTOS_BUCKET } from "@/lib/marketplace/constants";

/** Upload d'une photo pour une annonce appartenant à l'utilisateur connecté. */
export async function POST(
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

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  }

  const { count } = await supabase
    .from("listing_photos")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", id);

  const extension = file.name.split(".").pop() || "jpg";
  const storagePath = `${user.id}/${id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(LISTING_PHOTOS_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("listing_photos")
    .insert({ listing_id: Number(id), storage_path: storagePath, position: count ?? 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photo: data });
}
