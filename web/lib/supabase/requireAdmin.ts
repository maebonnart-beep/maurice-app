import { createClient } from "@/lib/supabase/server";

/** Vérifie que l'utilisateur connecté (session cookie) a profiles.is_admin = true. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "Non connecté." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { ok: false as const, status: 403, error: "Accès admin requis." };
  }

  return { ok: true as const, userId: user.id };
}
