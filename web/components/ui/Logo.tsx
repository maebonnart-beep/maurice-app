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
  /** Bandeau complet (illustration + emplacement recherche intégré au décor)
   *  réservé à l'accueil. Ailleurs (Mon compte, Seconde main, écran de
   *  résultats) : bandeau compact dédié, sans cet emplacement. */
  tags?: boolean;
}) {
  if (light) {
    // Bandeau clair — images fournies par la cliente (2026-09-16), un seul
    // style illustré cohérent : version accueil avec un wordmark plus grand
    // et une pastille teal vide intégrée au décor (cf. SearchHeroOverlay dans
    // DirectoryClient, calée dessus par coordonnées), version compacte pour
    // les autres écrans (même paysage, rognée). Chacune déjà au bon
    // cadrage — plus besoin de recadrage CSS forcé.
    if (!tags) {
      return (
        // Recadré plus serré (on rogne les franges de palmiers de chaque
        // côté, via object-cover — ratio plus étroit que le naturel 4.71:1
        // force le crop en largeur, pas en hauteur) pour que le wordmark
        // ressorte davantage — même principe que le bandeau d'accueil, sans
        // regénérer l'image.
        <div className="w-full aspect-[1746/415] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bandeau-kotemoris-clair-v7-notags.webp"
            alt="Koté Moris — les adresses de l'île Maurice"
            className="block w-full h-full object-cover"
          />
        </div>
      );
    }
    // Recadré pour ne garder que l'illustration (poulpe + paysage + texte),
    // zoomé sur le logo/wordmark pour qu'il reste lisible en petit format
    // mobile (2026-09-16). Rognage à la fois en largeur (zoom réel, réduit
    // les marges de palmiers, et fait sortir du cadre les bords arrondis de
    // la pastille de recherche bakée dans l'image d'origine — elle occupe
    // alors toute la largeur, sans coin visible) et en hauteur, jusqu'au bas
    // de cette pastille : la bulle de recherche réelle (cf. DirectoryClient)
    // est superposée dessus par coordonnées, directement dans le bandeau.
    // Image source : 1700×925. Fenêtre de rognage : x[136,1564] y[60,833].
    {
      const SRC_W = 1700;
      const SRC_H = 925;
      const CROP = { left: 136, top: 60, width: 1428, height: 773 };
      return (
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: `${CROP.width} / ${CROP.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/bandeau-kotemoris-clair-v8.webp"
            alt="Koté Moris — les adresses de l'île Maurice réunies sur une seule application"
            className="absolute block max-w-none"
            style={{
              width: `${(SRC_W / CROP.width) * 100}%`,
              height: `${(SRC_H / CROP.height) * 100}%`,
              left: `${-(CROP.left / CROP.width) * 100}%`,
              top: `${-(CROP.top / CROP.height) * 100}%`,
            }}
          />
        </div>
      );
    }
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
