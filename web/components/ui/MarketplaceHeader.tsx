import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

/** Bandeau minimal pour les pages "Seconde main"/"Mon compte" — routes Next.js
 *  indépendantes de DirectoryClient.tsx, sans header ni nav propre. Donne au
 *  moins un chemin de retour vers l'accueil. */
export function MarketplaceHeader() {
  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border">
      <div className="max-w-[640px] mx-auto px-4 h-14 flex items-center gap-3">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="shrink-0 w-9 h-9 -ml-1.5 rounded-full flex items-center justify-center text-ink hover:bg-surface-2 active:scale-95 transition"
        >
          <ArrowLeft size={19} weight="bold" aria-hidden />
        </Link>
        <Link href="/" className="flex items-center gap-1.5 no-underline text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-octopus.png" alt="" className="w-6 h-6 object-contain" />
          <span className="font-serif font-semibold text-[15px] leading-none">Koté Moris</span>
        </Link>
      </div>
    </header>
  );
}
