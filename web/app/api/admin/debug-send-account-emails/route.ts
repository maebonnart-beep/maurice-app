import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail, sendUpgradeEmail } from "@/lib/account/notifyAccount";

/** Route de debug temporaire : envoie un aperçu des deux mails de compte
 *  (bienvenue + upgrade) à l'admin connecté, sans passer par les vrais
 *  déclencheurs (login / webhook Stripe). À retirer après usage. */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "no email on admin user" }, { status: 400 });
  }

  await sendWelcomeEmail(user.email);
  await sendUpgradeEmail(user.email);

  return NextResponse.json({ ok: true, sentTo: user.email });
}
