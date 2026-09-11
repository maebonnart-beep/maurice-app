import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmailOnce } from "@/lib/account/notifyAccount";

/** Appelée côté client par LoginForm juste après verifyOtp (le vrai parcours de
 *  connexion du site — pas de lien magique, donc rien ne passe par /auth/callback).
 *  Best-effort : ne bloque jamais la connexion elle-même. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await sendWelcomeEmailOnce(supabase, user);
  }

  return NextResponse.json({ ok: true });
}
