"use client";

import { useSearchParams } from "next/navigation";
import type { Business } from "@/lib/types";
import PlanWizard from "./PlanWizard";

export default function PlanWizardEntry({ businesses }: { businesses: Business[] }) {
  // ?mode=plan (lien « Plan complet » de l'accueil) ouvre directement cet onglet.
  const initialMode = useSearchParams().get("mode") === "plan" ? "plan" : "lieu";
  return <PlanWizard businesses={businesses} initialMode={initialMode} />;
}
