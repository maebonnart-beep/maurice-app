import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { AccountClient } from "./AccountClient";
import { LogoutButton } from "./LogoutButton";

export const metadata = { title: "Mon compte — Maurice+" };

export default async function MonComptePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-[640px] mx-auto px-4 pt-10">
        {error && (
          <p className="max-w-[420px] mx-auto mb-4 text-[12.5px] text-red-600 text-center">
            Connexion impossible : {error}
          </p>
        )}
        <LoginForm />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  return (
    <>
      <AccountClient email={user.email ?? ""} isPremium={profile?.subscription_status === "active"} />
      <div className="max-w-[640px] mx-auto px-4">
        <LogoutButton />
      </div>
    </>
  );
}
