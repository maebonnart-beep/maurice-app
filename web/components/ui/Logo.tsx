/**
 * Logo KOTÉ MORIS — emblème poulpe détouré (image fournie par la cliente) + wordmark
 * « Koté / MORIS » en serif, empilé et centré sous le poulpe. Le poulpe reprend les
 * couleurs de la marque ; sur le bandeau teal, le wordmark passe en clair + accent.
 */
export function Logo({
  size = 96,
  light = false,
  tags = false,
}: {
  size?: number;
  light?: boolean;
  /** Bandeau complet (illustration + panneau balise avec les usages clés de
   *  l'appli) réservé à l'accueil. Ailleurs (Mon compte, Seconde main, écran
   *  de résultats) : bandeau compact dédié, sans le panneau. */
  tags?: boolean;
}) {
  if (light) {
    // Bandeau clair — 2 images distinctes fournies par la cliente (2026-09-16),
    // un seul style illustré cohérent pour les deux : version complète pour
    // l'accueil (poulpe + paysage + panneau balise listant favoris/vente entre
    // particuliers/alertes/partage), version compacte pour les autres écrans
    // (même paysage, rognée, sans panneau). Chacune déjà au bon cadrage —
    // plus besoin de recadrage CSS forcé comme sur l'ancienne version.
    if (!tags) {
      return (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bandeau-kotemoris-clair-v7-notags.webp"
            alt="Koté Moris — les adresses de l'île Maurice"
            className="block w-full h-auto"
          />
        </div>
      );
    }
    return (
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bandeau-kotemoris-clair-v7.webp"
          alt="Koté Moris — les adresses de l'île Maurice réunies sur une seule application"
          className="block w-full h-auto"
        />
      </div>
    );
  }
  return (
    // Lockup horizontal : poulpe (petit) à gauche + bloc texte à droite. Compact
    // en hauteur pour un bandeau fin, tout en gardant un wordmark généreux.
    <span className="inline-flex items-center gap-2.5 text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-octopus.png"
        alt="Koté Moris"
        className="shrink-0 object-contain drop-shadow-sm"
        style={{ height: size, width: size }}
      />
      <span className="flex flex-col items-start leading-none">
        {/* Ligne 1 : « Koté » (serif) + « MORIS » (turquoise, petites capitales). */}
        <span className="inline-flex items-baseline gap-2">
          <span className={`font-serif font-semibold text-[34px] tracking-tight ${light ? "text-on-band" : "text-ink"}`}>
            Koté
          </span>
          <span className="text-sm font-semibold tracking-[0.32em]" style={{ color: "#45c4c0" }}>
            MORIS
          </span>
        </span>
        {/* Ligne 2 : baseline cursive « les adresses de Maurice ». */}
        <span
          className={`mt-1 whitespace-nowrap leading-none ${light ? "text-on-band" : "text-ink"}`}
          style={{ fontFamily: "var(--font-script), cursive", fontSize: 27 }}
        >
          les adresses de Maurice
        </span>
      </span>
    </span>
  );
}
