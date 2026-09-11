"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";

/** Bandeau pour les pages "Seconde main"/"Mon compte" — routes Next.js
 *  indépendantes de DirectoryClient.tsx, sans header ni nav propre. Reprend
 *  le même bandeau « Logo light » que le reste de l'app (cf. en-tête dans
 *  DirectoryClient.tsx) pour rester cohérent, avec un retour à l'accueil.
 *  Ajoute une flèche retour (historique navigateur) : ces pages sont
 *  toujours ouvertes depuis un écran précédent (accueil, fiche, etc.) et
 *  n'avaient auparavant que le logo comme seule échappatoire, vers l'accueil
 *  uniquement — pas vers l'écran d'où l'utilisateur venait. */
export function MarketplaceHeader() {
  const router = useRouter();

  return (
    <header className="relative z-30 overflow-hidden bg-surface border-b border-border shadow-sm">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Retour"
        className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center text-on-band bg-black/20 active:scale-[.95] transition-transform"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden />
      </button>
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className="block relative w-full aspect-[864/281] hover:opacity-90 active:scale-[.98] transition"
      >
        <Logo light />
      </Link>
    </header>
  );
}
