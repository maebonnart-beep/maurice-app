/**
 * Logo KOTÉ MORIS — poulpe + pin de localisation, dessiné en vecteur de zéro
 * (design original). Tête ronde en haut (avec visage), 8 tentacules qui s'étalent
 * vers le bas et les côtés en ondulant ; pin et yeux en accent jaune.
 * Concept : le poulpe rassemble tout au même endroit — ses bras atteignent chaque univers.
 */

// Directions des 8 tentacules (repère écran, +y vers le bas) : toutes vers le BAS et
// les côtés (jamais vers le haut) → silhouette de poulpe, pas de soleil.
const ARM_DIRS: [number, number][] = [
  [-0.96, 0.28], // large gauche
  [-0.68, 0.74], // bas-gauche
  [-0.38, 0.95], // bas (gauche)
  [-0.13, 1.02], // bas (centre gauche)
  [0.13, 1.02], // bas (centre droite)
  [0.38, 0.95], // bas (droite)
  [0.68, 0.74], // bas-droite
  [0.96, 0.28], // large droite
];

const CX = 12;
const CY = 11; // origine des bras (sous la tête)

function armPath([dx, dy]: [number, number]): string {
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux; // perpendiculaire → ondulation
  const at = (dist: number, off: number): string =>
    `${(CX + ux * dist + px * off).toFixed(2)} ${(CY + uy * dist + py * off).toFixed(2)}`;
  const amp = 1.5;
  // Base sous la tête → onde +amp puis -amp → pointe recourbée.
  return `M ${at(2.8, 0)} Q ${at(4.4, amp)} ${at(6.2, 0)} Q ${at(8.0, -amp)} ${at(9.4, -amp * 0.55)}`;
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
        {/* Tentacules (derrière la tête, qui masque leurs bases) */}
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {ARM_DIRS.map((d, i) => (
            <path key={i} d={armPath(d)} />
          ))}
        </g>
        {/* Pin de localisation planté sur la tête */}
        <path
          d="M12 0.6 C 10.8 0.6 9.8 1.6 9.8 2.9 C 9.8 4.2 12 6 12 6 C 12 6 14.2 4.2 14.2 2.9 C 14.2 1.6 13.2 0.6 12 0.6 Z"
          fill="var(--accent)"
        />
        {/* Tête / mantel (bulbe arrondi en haut) */}
        <path
          d="M12 2.8 C 7.9 2.8 5.1 5.9 5.1 9.7 C 5.1 11.8 6.1 13 7.5 13.2 C 9 13.4 15 13.4 16.5 13.2 C 17.9 13 18.9 11.8 18.9 9.7 C 18.9 5.9 16.1 2.8 12 2.8 Z"
          fill="currentColor"
        />
        {/* Yeux */}
        <circle cx="9.9" cy="9.2" r="1.1" fill="var(--accent)" />
        <circle cx="14.1" cy="9.2" r="1.1" fill="var(--accent)" />
        {/* Sourire */}
        <path
          d="M10.4 11.1 C 11.3 12 12.7 12 13.6 11.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-serif font-semibold text-lg tracking-tight">Koté</span>
        <span className="text-[10px] font-semibold tracking-[0.34em] opacity-85 -mt-0.5">MORIS</span>
      </span>
    </span>
  );
}
