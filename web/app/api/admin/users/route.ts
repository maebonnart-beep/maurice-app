import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";

// L'e-mail vit dans auth.users (API admin GoTrue), pas dans la table
// `profiles` — on doit donc croiser les deux, uniquement possible avec la
// clé service-role, une fois requireAdmin() a confirmé profiles.is_admin.

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = createServiceRoleClient();

  const [{ data: usersPage, error: usersError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("profiles").select("id, is_admin, is_community_member, subscription_status"),
  ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = usersPage.users
    .map((u) => {
      const profile = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        isAdmin: profile?.is_admin ?? false,
        isCommunityMember: profile?.is_community_member ?? false,
        subscriptionStatus: profile?.subscription_status ?? "none",
      };
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json(rows);
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id, isAdmin, isCommunityMember } = (await request.json()) as {
    id: string;
    isAdmin?: boolean;
    isCommunityMember?: boolean;
  };

  if (!id || (isAdmin === undefined && isCommunityMember === undefined)) {
    return NextResponse.json({ error: "id et au moins un champ à modifier sont requis." }, { status: 400 });
  }

  if (isAdmin === false && id === admin.userId) {
    return NextResponse.json({ error: "Impossible de te retirer tes propres droits admin." }, { status: 400 });
  }

  const patch: { is_admin?: boolean; is_community_member?: boolean } = {};
  if (isAdmin !== undefined) patch.is_admin = isAdmin;
  if (isCommunityMember !== undefined) patch.is_community_member = isCommunityMember;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
