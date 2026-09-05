import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EditAnnonceClient } from "./EditAnnonceClient";

export const metadata = { title: "Modifier mon annonce — Maurice+" };

export default async function EditAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-[420px] mx-auto px-4 pt-10 text-center flex flex-col items-center gap-3">
        <p className="font-serif text-lg font-semibold leading-tight">Connexion requise</p>
        <Link
          href="/mon-compte"
          className="h-[44px] px-5 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return <EditAnnonceClient id={id} />;
}
