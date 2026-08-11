/**
 * Logo KOTÉ MORIS — emblème poulpe (image détourée fournie par la cliente) + wordmark
 * « Koté / MORIS » en serif. Le poulpe étant teal, le logo s'affiche sur fond clair.
 */
export function Logo({ size = 52, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* Icône de l'appli (poulpe dans le carré beige) : ressort sur le bandeau teal,
          contrairement au poulpe détouré de même couleur que le fond. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon-192.png"
        alt="Koté Moris"
        className="shrink-0 object-cover rounded-xl shadow-sm"
        style={{ height: size, width: size }}
      />
      <span className="flex flex-col leading-none">
        <span className={`font-serif font-semibold text-xl tracking-tight ${light ? "text-on-band" : "text-ink"}`}>
          Koté
        </span>
        <span className={`text-[10px] font-semibold tracking-[0.34em] -mt-0.5 ${light ? "text-accent" : "text-primary"}`}>
          MORIS
        </span>
      </span>
    </span>
  );
}
