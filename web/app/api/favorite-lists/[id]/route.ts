import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LIST_COLUMNS, LIST_LIMITS } from "@/lib/favoriteLists";

type PatchBody = {
  name?: string;
  description?: string;
  emoji?: string;
  period?: string;
  addBusinessId?: string;
  removeBusinessId?: string;
  setNote?: { businessId: string; note: string };
  shared?: boolean;
};

/** Trim + coupe à `max` ; chaîne vide → null (efface le champ). */
function clearableText(value: string, max: number): string | null {
  return value.trim().slice(0, max) || null;
}

/** Modification d'une liste : infos, ajout/retrait d'une fiche, note par fiche, partage. */
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
    .select("id, user_id, business_ids, notes")
    .eq("id", id)
    .single();

  if (!list || list.user_id !== user.id) {
    return NextResponse.json({ error: "Liste introuvable." }, { status: 404 });
  }

  const body = (await request.json()) as PatchBody;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let ids = (list.business_ids as string[]) ?? [];
  const notes = { ...((list.notes as Record<string, string>) ?? {}) };

  if (body.name !== undefined) {
    const name = clearableText(body.name, LIST_LIMITS.name);
    if (!name) {
      return NextResponse.json({ error: "Le nom ne peut pas être vide." }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.description !== undefined) patch.description = clearableText(body.description, LIST_LIMITS.description);
  if (body.emoji !== undefined) patch.emoji = clearableText(body.emoji, LIST_LIMITS.emoji);
  if (body.period !== undefined) patch.period = clearableText(body.period, LIST_LIMITS.period);

  if (body.addBusinessId && !ids.includes(body.addBusinessId)) {
    ids = [...ids, body.addBusinessId];
    patch.business_ids = ids;
  }

  if (body.removeBusinessId) {
    ids = ids.filter((bid) => bid !== body.removeBusinessId);
    patch.business_ids = ids;
    if (body.removeBusinessId in notes) {
      delete notes[body.removeBusinessId];
      patch.notes = notes;
    }
  }

  if (body.setNote && ids.includes(body.setNote.businessId)) {
    const note = clearableText(body.setNote.note ?? "", LIST_LIMITS.note);
    if (note) notes[body.setNote.businessId] = note;
    else delete notes[body.setNote.businessId];
    patch.notes = notes;
  }

  if (body.shared !== undefined) {
    patch.share_token = body.shared ? crypto.randomUUID().replace(/-/g, "") : null;
  }

  const { data, error } = await supabase
    .from("favorite_lists")
    .update(patch)
    .eq("id", id)
    .select(LIST_COLUMNS)
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
