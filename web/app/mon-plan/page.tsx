import { getBusinesses } from "@/lib/data";
import PlanWizard from "./PlanWizard";

export const metadata = { title: "Créer mon plan — Koté Moris" };

export default async function MonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const businesses = await getBusinesses();
  // ?mode=plan (lien « Plan complet » de l'accueil) ouvre directement cet onglet.
  const initialMode = (await searchParams).mode === "plan" ? "plan" : "lieu";
  return <PlanWizard businesses={businesses} initialMode={initialMode} />;
}
