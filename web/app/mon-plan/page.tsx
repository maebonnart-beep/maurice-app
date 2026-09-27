import { Suspense } from "react";
import { getBusinesses } from "@/lib/data";
import PlanWizardEntry from "./PlanWizardEntry";

export const metadata = { title: "Créer mon plan — Koté Moris" };

// Pas de searchParams côté serveur : la page reste statique (prérendue, mise en
// cache et préchargée par les liens) ; le mode est lu côté client.
export default async function MonPlanPage() {
  const businesses = await getBusinesses();
  return (
    <Suspense fallback={null}>
      <PlanWizardEntry businesses={businesses} />
    </Suspense>
  );
}
