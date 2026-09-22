/**
 * Logo KOTÉ MORIS — variante compacte (marque carrée K + fronde + fleur, image
 * fournie par la cliente) ; variantes `light` : bandeaux illustrés dédiés à
 * l'accueil et aux écrans secondaires (poulpe + décor).
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
    // Illustration pleine (poulpe + paysage + logo + recherche bakée dans le
    // décor), affichée dans son intégralité, sans recadrage (image fournie
    // par la cliente le 2026-09-18, 941×1672). La bulle de recherche réelle
    // (cf. SearchHeroOverlay dans DirectoryClient) est superposée dessus par
    // coordonnées en % calées sur la pastille dessinée dans l'image.
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "941 / 1672" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bandeau-kotemoris-accueil-v9.webp"
          alt="Koté Moris — les adresses de l'île Maurice réunies sur une seule application mobile"
          className="block w-full h-full object-cover"
          // Remonte le logo central : image décalée vers le haut (le bas,
          // dégradé vers le fond de page, absorbe le léger vide créé).
          style={{ transform: "translateY(-4%)" }}
        />
      </div>
    );
  }
  return (
    // Marque carrée K + fronde + fleur, texte "Koté MORIS" et baseline bakés dans
    // l'image (même déclinaison que les icônes app/favicon) — pas de composition
    // séparée poulpe + texte.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-octopus.png"
      alt="Koté Moris — les adresses de Maurice"
      className="shrink-0 object-contain rounded-2xl drop-shadow-sm"
      style={{ height: size, width: size }}
    />
  );
}
