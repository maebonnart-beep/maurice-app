import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PatchBody = {
  name?: string;
  addBusinessId?: string;
  removeBusinessId?: string;
  shared?: boolean;
};

/** Modification d'une liste : renommer, ajouter/retirer une fiche, activer/désactiver le partage. */
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

  const { data: list } = await supabase
    .from("favorite_lists")
    .select("id, user_id, business_ids")
    .eq("id", id)
    .single();

  if (!list || list.user_id !== user.id) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  const body = (await request.json()) as PatchBody;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name ne peut pas être vide." }, { status: 400 });
    }
    patch.name = name;
  }

  if (body.addBusinessId) {
    const ids = (list.business_ids as string[]) ?? [];
    if (!ids.includes(body.addBusinessId)) patch.business_ids = [...ids, body.addBusinessId];
  }

  if (body.removeBusinessId) {
    const ids = (list.business_ids as string[]) ?? [];
    patch.business_ids = ids.filter((bid) => bid !== body.removeBusinessId);
  }

  if (body.shared !== undefined) {
    patch.share_token = body.shared ? crypto.randomUUID().replace(/-/g, "") : null;
  }

  const { data, error } = await supabase
    .from("favorite_lists")
    .update(patch)
    .eq("id", id)
    .select("id, name, business_ids, share_token, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, list: data });
}

/** Suppression d'une liste par son propriétaire. */
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

  const { error } = await supabase.from("favorite_lists").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
