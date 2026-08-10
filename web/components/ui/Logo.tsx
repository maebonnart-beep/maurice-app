/**
 * Logo KOTÉ MORIS — poulpe + pin de localisation, dessiné en vecteur de zéro
 * (design original). Tête + 8 tentacules qui ondulent dans toutes les directions
 * (haut, bas, côtés) ; pin et yeux en accent jaune. Concept : le poulpe rassemble
 * tout au même endroit — ses bras atteignent chaque univers.
 */

// Directions des 8 tentacules (repère écran, +y vers le bas). Paires symétriques
// gauche/droite ; certaines montent, d'autres descendent ou partent sur les côtés.
const ARM_DIRS: [number, number][] = [
  [-0.28, 1.02], // bas (intérieur gauche)
  [0.28, 1.02], // bas (intérieur droite)
  [-0.72, 0.85], // bas-gauche
  [0.72, 0.85], // bas-droite
  [-1, 0.18], // gauche
  [1, 0.18], // droite
  [-0.82, -0.5], // haut-gauche
  [0.82, -0.5], // haut-droite
];

const CX = 12;
const CY = 11.6;

function armPath([dx, dy]: [number, number]): string {
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len; // direction unitaire
  const px = -uy;
  const py = ux; // perpendiculaire (donne l'ondulation)
  const at = (dist: number, off: number): string =>
    `${(CX + ux * dist + px * off).toFixed(2)} ${(CY + uy * dist + py * off).toFixed(2)}`;
  const amp = 1.5;
  // Base sous le corps → onde +amp puis -amp → pointe recourbée.
  return `M ${at(3.6, 0)} Q ${at(4.8, amp)} ${at(6.0, 0)} Q ${at(7.2, -amp)} ${at(8.5, -amp * 0.5)}`;
}

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
        {/* Tentacules (derrière le corps) */}
        <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          {ARM_DIRS.map((d, i) => (
            <path key={i} d={armPath(d)} />
          ))}
        </g>
        {/* Pin de localisation planté sur la tête */}
        <path
          d="M12 0.8 C 10.9 0.8 10 1.7 10 2.9 C 10 4.1 12 5.7 12 5.7 C 12 5.7 14 4.1 14 2.9 C 14 1.7 13.1 0.8 12 0.8 Z"
          fill="var(--accent)"
        />
        {/* Tête / corps */}
        <ellipse cx="12" cy="11.4" rx="4.4" ry="4.2" fill="currentColor" />
        {/* Yeux */}
        <circle cx="10.1" cy="10.7" r="1.05" fill="var(--accent)" />
        <circle cx="13.9" cy="10.7" r="1.05" fill="var(--accent)" />
        {/* Sourire */}
        <path
          d="M10.6 12.5 C 11.4 13.3 12.6 13.3 13.4 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.15"
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
