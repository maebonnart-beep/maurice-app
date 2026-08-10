/**
 * Logo KOTÉ MORIS — poulpe + pin de localisation, dessiné en vecteur de zéro
 * (design original, inspiré du concept fourni mais sans copie du visuel raster).
 * Tête + 6 bras en `currentColor` (s'adapte au fond) ; pin et yeux en accent jaune.
 * Concept : le poulpe rassemble tout au même endroit — un bras par univers.
 */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
        {/* Pin de localisation planté sur la tête */}
        <path
          d="M12 0.8 C 10.9 0.8 10 1.7 10 2.9 C 10 4.1 12 5.7 12 5.7 C 12 5.7 14 4.1 14 2.9 C 14 1.7 13.1 0.8 12 0.8 Z"
          fill="var(--accent)"
        />
        {/* Tête / mantel */}
        <path
          d="M12 5 C 8.4 5 5.8 7.7 5.8 10.9 C 5.8 12.7 6.7 13.8 7.7 14 L 16.3 14 C 17.3 13.8 18.2 12.7 18.2 10.9 C 18.2 7.7 15.6 5 12 5 Z"
          fill="currentColor"
        />
        {/* Yeux */}
        <circle cx="9.9" cy="10.3" r="1.05" fill="var(--accent)" />
        <circle cx="14.1" cy="10.3" r="1.05" fill="var(--accent)" />
        {/* Sourire */}
        <path
          d="M10.5 12.1 C 11.3 12.9 12.7 12.9 13.5 12.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Bras */}
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7.7 13.9 C 6.1 16.4 4.8 17.2 3.6 18.5" />
          <path d="M9.5 14 C 8.9 16.6 8.4 18.1 7.5 19.8" />
          <path d="M11.3 14 C 11.2 16.7 11 18.4 10.8 20.5" />
          <path d="M12.7 14 C 12.8 16.7 13 18.4 13.2 20.5" />
          <path d="M14.5 14 C 15.1 16.6 15.6 18.1 16.5 19.8" />
          <path d="M16.3 13.9 C 17.9 16.4 19.2 17.2 20.4 18.5" />
        </g>
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif font-semibold text-lg tracking-tight">Koté</span>
        <span className="text-[10px] font-semibold tracking-[0.34em] opacity-85 -mt-0.5">MORIS</span>
      </span>
    </span>
  );
}
