import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminSecondeMainClient } from "./AdminSecondeMainClient";

export const metadata = { title: "Modération — Maurice+" };

export default async function AdminSecondeMainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-[420px] mx-auto px-4 pt-10 text-center flex flex-col items-center gap-3">
        <p className="font-serif text-lg font-semibold leading-tight">Connexion requise</p>
        <p className="text-[13px] text-muted leading-snug">
          Connecte-toi d&apos;abord, puis reviens sur ce lien pour accéder à la modération.
        </p>
        <Link
          href="/mon-compte"
          className="h-[44px] px-5 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return (
      <div className="max-w-[420px] mx-auto px-4 pt-10 text-center">
        <p className="text-[13px] text-muted leading-snug">Accès réservé à l&apos;équipe Koté Moris.</p>
      </div>
    );
  }

  return <AdminSecondeMainClient />;
}
