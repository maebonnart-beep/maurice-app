"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "@/lib/marketplace/useAccount";
import {
  PREMIUM_PRICE_LABEL,
  PREMIUM_PRICE_LABEL_ANNUAL,
  PREMIUM_PRICE_LABEL_EUR,
  PREMIUM_PRICE_LABEL_ANNUAL_EUR,
  MAX_ACTIVE_LISTINGS,
} from "@/lib/marketplace/constants";

type Plan = "monthly" | "annual";
type Currency = "mur" | "eur";

const PLAN_LABELS: Record<Currency, Record<Plan, string>> = {
  mur: { monthly: PREMIUM_PRICE_LABEL, annual: PREMIUM_PRICE_LABEL_ANNUAL },
  eur: { monthly: PREMIUM_PRICE_LABEL_EUR, annual: PREMIUM_PRICE_LABEL_ANNUAL_EUR },
};

export function UpgradeClient() {
  const account = useAccount();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan>("monthly");
  const [currency, setCurrency] = useState<Currency>("mur");

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, currency }),
    });
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[420px] mx-auto px-4 pt-10 text-center flex flex-col items-center gap-4">
      <p className="font-serif text-xl font-semibold leading-tight">Passer premium</p>
      <p className="text-[13px] text-muted leading-snug">
        Dépose jusqu&apos;à {MAX_ACTIVE_LISTINGS} annonces seconde main actives (contact direct par
        WhatsApp avec les acheteurs) et débloque l&apos;accès complet aux événements : notifications
        sur tes thématiques favorites et alertes personnalisées.
      </p>
      <div className="w-full flex gap-2 bg-surface-2 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setCurrency("mur")}
          className={`flex-1 h-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
            currency === "mur" ? "bg-surface shadow-sm text-primary-deep" : "text-muted"
          }`}
        >
          Rs (Maurice)
        </button>
        <button
          type="button"
          onClick={() => setCurrency("eur")}
          className={`flex-1 h-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
            currency === "eur" ? "bg-surface shadow-sm text-primary-deep" : "text-muted"
          }`}
        >
          € (Europe)
        </button>
      </div>
      <div className="w-full flex gap-2 bg-surface-2 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setPlan("monthly")}
          className={`flex-1 h-[40px] rounded-lg text-[13.5px] font-semibold transition-colors ${
            plan === "monthly" ? "bg-surface shadow-sm text-primary-deep" : "text-muted"
          }`}
        >
          Mensuel · {PLAN_LABELS[currency].monthly}
        </button>
        <button
          type="button"
          onClick={() => setPlan("annual")}
          className={`flex-1 h-[40px] rounded-lg text-[13.5px] font-semibold transition-colors ${
            plan === "annual" ? "bg-surface shadow-sm text-primary-deep" : "text-muted"
          }`}
        >
          Annuel · {PLAN_LABELS[currency].annual}
        </button>
      </div>
      {account.loading ? (
        <p className="text-[13px] text-muted">Chargement…</p>
      ) : !account.loggedIn ? (
        <>
          <p className="text-[12.5px] text-muted -mt-1.5">Déjà abonné ? Connecte-toi pour retrouver ton accès.</p>
          <Link
            href="/mon-compte"
            className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-primary active:scale-[.98] transition-transform flex items-center justify-center"
          >
            Se connecter
          </Link>
        </>
      ) : (
        <button
          onClick={startCheckout}
          disabled={loading}
          className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
        >
          {loading ? "Redirection…" : "S'abonner"}
        </button>
      )}
    </div>
  );
}
