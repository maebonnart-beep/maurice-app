/**
 * Illustrations Koté Moris de l'écran « Expérience » (/mon-plan), découpées
 * dans la maquette « Planche DESIGN/ChatGPT Image 25 sept. 2026, 06_12_54.png »
 * (public/plan-icons/). Les emojis de lib/plan.ts et data/categories.ts restent
 * la valeur de repli partout ailleurs (et pour toute option sans illustration).
 */
export const PLAN_THEME_ICONS: Record<string, string> = {
  resto: "/plan-icons/resto.webp",
  bar: "/plan-icons/bar.webp",
  plage: "/plan-icons/plage.webp",
  excursion: "/plan-icons/excursion.webp",
  visite: "/plan-icons/visite.webp",
  sport: "/plan-icons/sport.webp",
  "bien-etre": "/plan-icons/bien-etre.webp",
  enfants: "/plan-icons/enfants.webp",
  shopping: "/plan-icons/shopping.webp",
};

/** Options de filtre (clé d'option de FILTER_GROUPS) : cuisines + ambiance / public. */
export const PLAN_OPTION_ICONS: Record<string, string> = {
  mauricienne: "/plan-icons/mauricienne.webp",
  "fruits-de-mer": "/plan-icons/fruits-de-mer.webp",
  indienne: "/plan-icons/indienne.webp",
  asiatique: "/plan-icons/asiatique.webp",
  sushis: "/plan-icons/sushis.webp",
  europeenne: "/plan-icons/europeenne.webp",
  italien: "/plan-icons/italien.webp",
  grillades: "/plan-icons/grillades.webp",
  vegetarien: "/plan-icons/vegetarien.webp",
  "kids-friendly": "/plan-icons/kids-friendly.webp",
  "tables-exception": "/plan-icons/tables-exception.webp",
  "plus-belles-vues": "/plan-icons/plus-belles-vues.webp",
  "frequente-locaux": "/plan-icons/frequente-locaux.webp",
};
