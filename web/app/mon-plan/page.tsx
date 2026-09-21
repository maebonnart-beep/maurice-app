import { getBusinesses } from "@/lib/data";
import PlanWizard from "./PlanWizard";

export const metadata = { title: "Créer mon plan — Koté Moris" };

export default async function MonPlanPage() {
  const businesses = await getBusinesses();
  return <PlanWizard businesses={businesses} />;
}
