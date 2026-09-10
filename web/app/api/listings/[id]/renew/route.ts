import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { LISTING_TTL_DAYS } from "@/lib/marketplace/constants";

/**
 * Renouvellement d'une annonce expirée (ou sur le point de l'être) par son propriétaire.
 * Le contenu ne change pas — déjà validé lors de la première approbation — donc on
 * ré-approuve directement plutôt que de repasser par la modération admin : un vrai
 * renouvellement en un clic, sans trou de visibilité en attendant une validation.
 *
 * La mise à jour finale passe par la clé service-role : le grant UPDATE sur
 * `listings` pour `authenticated` ne couvre que les colonnes de contenu
 * (titre, description, prix, catégorie, whatsapp, zone) — le propriétaire ne
 * peut plus modifier status/approved_at/expires_at lui-même, pour empêcher
 * l'auto-approbation. Propriété et éligibilité restent vérifiées juste avant,
 * avec le client session.
 */
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

  const { data, error } = await createServiceRoleClient()
    .from("listings")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + LISTING_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, listing: data });
}
