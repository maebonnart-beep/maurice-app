/**
 * Décor plein cadre du bandeau d'accueil : lagon + palmiers + montagne stylisés,
 * en arrière-plan du poulpe (cf. rendu de référence fourni par la cliente).
 * SVG vectoriel (pas de photo) pour rester léger et cohérent avec la palette
 * de la marque (tokens --band / --primary / --accent de globals.css).
 */
export function HomeBandeauScene() {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    >
      <defs>
        <linearGradient id="hbs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bg)" />
          <stop offset="100%" stopColor="var(--primary-tint)" />
        </linearGradient>
        <linearGradient id="hbs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--band)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--band-deep)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="400" height="220" fill="url(#hbs-sky)" />

      {/* Montagne stylisée, angle droit — écho du Piton du rendu de référence. */}
      <path
        d="M266 190 L306 118 L332 154 L358 128 L400 190 Z"
        fill="var(--primary)"
        opacity="0.16"
      />
      <path
        d="M300 190 L336 140 L400 190 Z"
        fill="var(--primary-deep)"
        opacity="0.14"
      />

      {/* Lagon — bande basse ondulée. */}
      <path
        d="M0 176 C 60 160, 120 192, 190 174 C 260 156, 330 190, 400 172 L400 220 L0 220 Z"
        fill="url(#hbs-sea)"
      />
    </svg>
  );
}
