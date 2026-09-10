import { getBusinesses } from "@/lib/data";
import { getPreviewListings } from "@/lib/marketplace/getPreviewListings";
import DirectoryClient from "./DirectoryClient";

export default async function Home() {
  const businesses = await getBusinesses();
  const previewListings = await getPreviewListings();

  return <DirectoryClient businesses={businesses} previewListings={previewListings} />;
}
