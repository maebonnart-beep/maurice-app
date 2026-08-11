/**
 * Logo KOTÉ MORIS — emblème poulpe détouré (image fournie par la cliente) + wordmark
 * « Koté / MORIS » en serif, empilé et centré sous le poulpe. Le poulpe reprend les
 * couleurs de la marque ; sur le bandeau teal, le wordmark passe en clair + accent.
 */
export function Logo({ size = 96, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex flex-col items-center gap-1 text-center">
      {/* Rangée : poulpe détouré (gauche) + wordmark « Koté / MORIS » (droite). */}
      <span className="inline-flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-octopus.png"
          alt="Koté Moris"
          className="shrink-0 object-contain drop-shadow-sm"
          style={{ height: size, width: size }}
        />
        <span className="flex flex-col items-start leading-none">
          <span className={`font-serif font-semibold text-2xl tracking-tight ${light ? "text-on-band" : "text-ink"}`}>
            Koté
          </span>
          {/* « MORIS » en turquoise (couleur des accents du poulpe) plutôt qu'en jaune. */}
          <span className="text-xs font-semibold tracking-[0.34em] mt-0.5" style={{ color: "#45c4c0" }}>
            MORIS
          </span>
        </span>
      </span>
      {/* Baseline « les adresses de Maurice » : version manuscrite/cursive,
          détourée en crème pour ressortir sur le bandeau teal. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tagline-cursive.png"
        alt="les adresses de Maurice"
        className="mt-0.5 w-auto object-contain"
        style={{ height: 54 }}
      />
    </span>
  );
}
