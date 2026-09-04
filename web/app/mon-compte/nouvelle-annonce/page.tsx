import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NouvelleAnnonceForm } from "./NouvelleAnnonceForm";

export const metadata = { title: "Déposer une annonce — Maurice+" };

export default async function NouvelleAnnoncePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mon-compte");
  }

  return <NouvelleAnnonceForm />;
}
