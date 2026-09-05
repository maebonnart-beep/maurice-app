import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase pour Server Components / Route Handlers, lié à la session cookie de la requête. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (pas un Route Handler/action) :
            // l'écriture est ignorée, le middleware se charge du rafraîchissement de session.
          }
        },
      },
    }
  );
}

/** Client Supabase avec la clé service-role : bypass RLS, réservé aux routes serveur (admin, webhooks, cron). */
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
