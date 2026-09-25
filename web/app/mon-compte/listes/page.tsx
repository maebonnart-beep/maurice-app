import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListesClient } from "./ListesClient";

export const metadata = { title: "Mes listes — Koté Moris" };

export default async function ListesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mon-compte");
  }

  const sp = await searchParams;
  const listId = sp.id ? Number(sp.id) : null;

  return <ListesClient listId={Number.isFinite(listId) ? listId : null} startCreating={sp.new === "1"} />;
}
