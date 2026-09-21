/** Fond du bandeau du haut hors accueil : ancien décor (feuillages, logo
 *  « Koté MORIS ») sans la mascotte. L'image d'origine est conservée mais son
 *  côté droit (le poulpe) est recouvert par le côté gauche de la même image,
 *  retourné en miroir avec un fondu — on retrouve ainsi les grandes feuilles
 *  des deux côtés. À placer en premier enfant d'un conteneur
 *  `relative overflow-hidden h-[88px]` ; les boutons (retour, loupe) passent
 *  par-dessus grâce à leur `relative`. */
export function BannerBackdrop() {
  const filter = "brightness(1.14) saturate(1.05)";
  return (
    <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[433px] h-[88px] max-w-none pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bandeau-kotemoris-resultats.png" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bandeau-kotemoris-resultats.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        style={{
          filter,
          maskImage: "linear-gradient(to left, transparent 66%, #000 74%)",
          WebkitMaskImage: "linear-gradient(to left, transparent 66%, #000 74%)",
        }}
      />
    </div>
  );
}
