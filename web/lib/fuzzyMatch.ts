/** Enlève les accents pour comparer "café" et "cafe", "légumes" et "legumes"... */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Découpe un texte en mots normalisés — à précalculer une fois par fiche
 *  (côté appelant) plutôt qu'à chaque recherche : c'est la partie coûteuse
 *  (normalize + regex) qui n'a pas besoin d'être refaite à chaque frappe. */
export function tokenize(s: string): string[] {
  return normalizeText(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/** Distance d'édition (Levenshtein) entre deux chaînes. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Cherche `query` parmi les mots déjà normalisés/découpés `hayTokens`, en
 * tolérant les fautes de frappe : chaque mot de la recherche doit préfixer
 * un des mots cible (recherche partielle du type "rest" → "restaurant"), ou
 * en être proche (distance de Levenshtein, réservée aux mots assez longs
 * pour que ça reste pertinent — en dessous, la marge d'erreur ferait
 * remonter des mots sans rapport).
 *
 * Variante de `fuzzyMatch` qui prend directement les tokens précalculés
 * (voir `tokenize`) au lieu de re-découper le texte cible à chaque appel —
 * à utiliser quand la même fiche est recherchée à chaque frappe.
 */
export function fuzzyMatchTokens(hayTokens: string[], query: string): boolean {
  const q = normalizeText(query).trim();
  if (!q) return true;
  const queryTokens = q.split(/\s+/).filter(Boolean);
  return queryTokens.every((qt) => {
    if (hayTokens.some((ht) => ht.startsWith(qt))) return true;
    if (qt.length <= 3) return false;
    const maxDist = qt.length <= 6 ? 1 : 2;
    return hayTokens.some((ht) => levenshtein(qt, ht) <= maxDist);
  });
}

/** Cherche `query` dans `haystack` brut (re-découpe à chaque appel — voir
 *  `fuzzyMatchTokens` pour la variante précalculée, plus adaptée à une
 *  recherche répétée sur le même texte). */
export function fuzzyMatch(haystack: string, query: string): boolean {
  return fuzzyMatchTokens(tokenize(haystack), query);
}
