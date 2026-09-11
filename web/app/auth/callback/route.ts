import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sendWelcomeEmail } from "@/lib/account/notifyAccount";

/** Échange le `code` PKCE du lien magique contre une session, puis redirige vers /mon-compte.
 *  Écrit les cookies directement sur la réponse de redirection (plutôt que via
 *  next/headers cookies()) pour être sûr qu'ils partent bien avec le 307. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/mon-compte?error=${encodeURIComponent(errorDescription)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/mon-compte`);
  }

  let response = NextResponse.redirect(`${origin}/mon-compte`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response = NextResponse.redirect(`${origin}/mon-compte?error=${encodeURIComponent(error.message)}`);
    return response;
  }

  const user = data.user;
  if (user?.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_email_sent_at")
      .eq("id", user.id)
      .single();
    if (profile && !profile.welcome_email_sent_at) {
      await sendWelcomeEmail(user.email);
      await supabase.from("profiles").update({ welcome_email_sent_at: new Date().toISOString() }).eq("id", user.id);
    }
  }

  return response;
}
