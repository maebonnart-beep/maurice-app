import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/server";
import { mapListingRow } from "@/lib/marketplace/mapRow";
import type { Listing } from "@/lib/marketplace/types";

/** Aperçu des dernières annonces approuvées pour la page d'accueil.
 *  Mis en cache (RLS toujours appliqué via la clé anon) pour que la route "/" reste
 *  statique et que la navigation retour depuis les autres pages soit instantanée. */
export const getPreviewListings = unstable_cache(
  async (): Promise<Listing[]> => {
    const supabase = createAnonClient();
    const { data } = await supabase
      .from("listings")
      .select("*, listing_photos(*)")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(8);
    return (data ?? []).map(mapListingRow);
  },
  ["home-preview-listings"],
  { revalidate: 60, tags: ["preview-listings"] }
);
