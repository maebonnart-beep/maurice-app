import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertesClient } from "./AlertesClient";
import type { SavedSearchType } from "@/lib/alerts/types";

export const metadata = { title: "Mes alertes — Maurice+" };

export default async function AlertesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    category?: string;
    zone?: string;
    themes?: string;
    filters?: string;
  }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mon-compte");
  }

  const sp = await searchParams;
  const prefillType: SavedSearchType | undefined =
    sp.type === "listing" || sp.type === "event" ? sp.type : undefined;

  return (
    <AlertesClient
      prefill={{
        type: prefillType,
        category: sp.category,
        zone: sp.zone,
        themes: sp.themes ? sp.themes.split(",").filter(Boolean) : undefined,
        filters: sp.filters ? sp.filters.split(",").filter(Boolean) : undefined,
      }}
    />
  );
}
