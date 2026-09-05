import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Renouvellement d'une annonce expirée (ou sur le point de l'être) par son propriétaire : repasse en modération. */
export async function PATCH(
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
    .select("id, user_id, status")
    .eq("id", id)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  if (!["expired", "approved"].includes(listing.status)) {
    return NextResponse.json(
      { error: "Seule une annonce approuvée ou expirée peut être renouvelée." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .update({ status: "pending", expires_at: null, approved_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: data });
}
