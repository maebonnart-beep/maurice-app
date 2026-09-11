"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

/** Flèche retour (historique navigateur), à placer au niveau du titre de
 *  chaque page "Seconde main"/"Mon compte" — mêmes routes Next.js que
 *  MarketplaceHeader, cf. son commentaire pour le contexte. */
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Retour"
      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform ${className}`}
    >
      <ArrowLeft size={17} weight="bold" aria-hidden />
    </button>
  );
}
