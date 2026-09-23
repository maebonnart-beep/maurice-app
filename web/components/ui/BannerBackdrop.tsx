/** Fond du bandeau du haut hors accueil : illustration « Koté MORIS — Les
 *  adresses de Maurice » (feuillages, Morne, poulpe, gecko), cf.
 *  bandeau-kotemoris-v2.webp. Boîte de largeur fixe centrée : l'image en
 *  `object-cover` y est recadrée en hauteur autour du logo. Sur écran large,
 *  les bords sont fondus dans le dégradé turquoise du conteneur. En bas, un
 *  flou progressif + un dégradé vers le fond de page (--bg) fondent le
 *  bandeau dans la suite de l'écran, sans coupure nette. À placer en
 *  premier enfant d'un conteneur `relative overflow-hidden h-[88px]` ; les
 *  boutons (retour, loupe) passent par-dessus grâce à leur `relative`. */
export function BannerBackdrop() {
  const mask = "linear-gradient(to right, transparent 0, #000 6%, #000 94%, transparent 100%)";
  const blurMask = "linear-gradient(to bottom, transparent 0%, #000 80%)";
  return (
    <>
      <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[433px] h-[88px] max-w-none pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bandeau-kotemoris-v2.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        />
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[22px] pointer-events-none"
        style={{
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          maskImage: blurMask,
          WebkitMaskImage: blurMask,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-[20px] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--bg) 20%, transparent) 35%, color-mix(in srgb, var(--bg) 65%, transparent) 70%, var(--bg) 100%)",
        }}
      />
    </>
  );
}
