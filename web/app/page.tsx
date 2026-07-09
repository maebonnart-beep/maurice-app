import { getBusinesses } from "@/lib/data";
import DirectoryClient from "./DirectoryClient";

export default async function Home() {
  const businesses = await getBusinesses();
  return <DirectoryClient businesses={businesses} />;
}
