import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListesClient } from "./ListesClient";

export const metadata = { title: "Mes listes — Maurice+" };

export default async function ListesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mon-compte");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  return <ListesClient isPremium={profile?.subscription_status === "active"} />;
}
