import { getBusinesses } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { mapListingRow } from "@/lib/marketplace/mapRow";
import DirectoryClient from "./DirectoryClient";

export default async function Home() {
  const businesses = await getBusinesses();

  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(8);
  const previewListings = (data ?? []).map(mapListingRow);

  return <DirectoryClient businesses={businesses} previewListings={previewListings} />;
}
