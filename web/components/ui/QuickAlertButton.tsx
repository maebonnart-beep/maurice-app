"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRinging, CheckCircle } from "@phosphor-icons/react";
import type { SavedSearchCriteria, SavedSearchType } from "@/lib/alerts/types";

type Status = "idle" | "creating" | "done" | "auth" | "error";

/** Bouton de création d'alerte "en un clic" : crée l'alerte pour les critères
 *  donnés sans quitter la page (contrairement au lien vers /mon-compte/alertes,
 *  réservé à la gestion générale). */
export function QuickAlertButton({
  type,
  criteria,
  label = "Créer une alerte pour cette recherche",
}: {
  type: SavedSearchType;
  criteria: SavedSearchCriteria;
  label?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  async function create() {
    setStatus("creating");
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, criteria }),
    });
    if (res.status === 401) {
      setStatus("auth");
      return;
    }
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <p className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
        <CheckCircle size={15} weight="fill" aria-hidden />
        Alerte créée —{" "}
        <Link href="/mon-compte/alertes" className="underline">
          gérer mes alertes
        </Link>
      </p>
    );
  }

  if (status === "auth") {
    return (
      <p className="text-[12.5px] text-muted">
        <Link href="/mon-compte" className="font-semibold text-primary-deep underline">
          Connecte-toi
        </Link>{" "}
        pour créer une alerte.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={create}
      disabled={status === "creating"}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary-deep underline disabled:opacity-50"
    >
      <BellRinging size={14} weight="fill" aria-hidden />
      {status === "creating" ? "Création…" : label}
      {status === "error" && <span className="text-red-600 no-underline"> — erreur, réessaie</span>}
    </button>
  );
}
