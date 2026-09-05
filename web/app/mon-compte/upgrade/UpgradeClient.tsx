"use client";

import { useState } from "react";
import { PREMIUM_PRICE_LABEL, MAX_ACTIVE_LISTINGS } from "@/lib/marketplace/constants";

export function UpgradeClient() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
        Déposez jusqu&apos;à {MAX_ACTIVE_LISTINGS} annonces seconde main actives en même temps,
        contact direct par WhatsApp avec les acheteurs.
      </p>
      <p className="font-serif text-2xl font-semibold text-primary-deep">{PREMIUM_PRICE_LABEL}</p>
      <button
        onClick={startCheckout}
        disabled={loading}
        className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
      >
        {loading ? "Redirection…" : "S'abonner"}
      </button>
    </div>
  );
}
