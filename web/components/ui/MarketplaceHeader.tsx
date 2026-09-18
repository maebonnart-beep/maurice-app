import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

/** Bandeau pour les pages "Seconde main"/"Mon compte" — routes Next.js
 *  indépendantes de DirectoryClient.tsx, sans header ni nav propre. Reprend
 *  le même bandeau illustré Koté Moris que le reste de l'app hors accueil
 *  (cf. en-tête dans DirectoryClient.tsx), avec la flèche retour vers
 *  l'accueil. La flèche retour (cf. BackButton) est aussi affichée au
 *  niveau du titre de chaque page, pour rester au plus près du contenu ;
 *  pas de recherche ici, ces pages n'en ont pas. */
export function MarketplaceHeader() {
  return (
    <header className="relative z-30 overflow-hidden shadow-sm">
      <Link
        href="/"
        aria-label="Retour à l'accueil"
        className="relative flex items-center w-full px-4 lg:px-5 h-[88px] hover:opacity-90 active:scale-[.98] transition"
        style={{ background: "linear-gradient(135deg, #0a4d53 0%, #0f7a80 45%, #128a8f 100%)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bandeau-kotemoris-resultats.png"
          alt="Koté Moris"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[433px] h-[88px] max-w-none object-cover"
          style={{ filter: "brightness(1.14) saturate(1.05)" }}
        />
        <span className="relative shrink-0 w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white">
          <ArrowLeft size={19} weight="bold" aria-hidden />
        </span>
      </Link>
    </header>
  );
}
