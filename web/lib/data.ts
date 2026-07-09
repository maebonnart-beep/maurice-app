import businesses from "@/data/businesses.json";
import type { Business } from "@/lib/types";

export async function getBusinesses(): Promise<Business[]> {
  return businesses as Business[];
}
