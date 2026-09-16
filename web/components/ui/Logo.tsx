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
    return (
      // Recadré pour ne garder que l'illustration (poulpe + paysage + texte),
      // SANS la pastille de recherche bakée dans l'image d'origine : la
      // pastille bakée était trop basse pour accueillir un texte lisible.
      // La recherche vit maintenant dans un bloc CSS ordinaire juste en
      // dessous (cf. DirectoryClient), libre en hauteur/taille de texte.
      // object-position "50% 19%" : rogne 65px de ciel en haut et le reste
      // (la pastille) en bas, sur les 925px source (1700×925).
      <div className="w-full aspect-[1700/585] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bandeau-kotemoris-clair-v8.webp"
          alt="Koté Moris — les adresses de l'île Maurice réunies sur une seule application"
          className="block w-full h-full object-cover"
          style={{ objectPosition: "50% 19%" }}
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
