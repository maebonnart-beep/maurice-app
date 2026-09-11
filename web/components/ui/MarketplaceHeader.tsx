import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/** Bandeau pour les pages "Seconde main"/"Mon compte" — routes Next.js
 *  indépendantes de DirectoryClient.tsx, sans header ni nav propre. Reprend
 *  le même bandeau « Logo light » que le reste de l'app (cf. en-tête dans
 *  DirectoryClient.tsx) pour rester cohérent, avec un retour à l'accueil. */
export function MarketplaceHeader() {
  return (
    <header className="relative z-30 overflow-hidden bg-surface border-b border-border shadow-sm">
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
