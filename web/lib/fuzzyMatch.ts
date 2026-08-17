/** Enlève les accents pour comparer "café" et "cafe", "légumes" et "legumes"... */
export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
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
 * Cherche `query` dans `haystack` en tolérant les fautes de frappe : chaque
 * mot de la recherche doit soit apparaître tel quel (sous-chaîne, pour les
 * recherches partielles du type "rest"), soit être proche (distance de
 * Levenshtein) d'un des mots du texte cible.
 */
export function fuzzyMatch(haystack: string, query: string): boolean {
  const hay = normalizeText(haystack);
  const q = normalizeText(query).trim();
  if (!q) return true;
  const queryTokens = q.split(/\s+/).filter(Boolean);
  const hayTokens = hay.split(/[^a-z0-9]+/).filter(Boolean);
  return queryTokens.every((qt) => {
    if (hay.includes(qt)) return true;
    const maxDist = qt.length <= 4 ? 1 : qt.length <= 8 ? 2 : 3;
    return hayTokens.some((ht) => levenshtein(qt, ht) <= maxDist);
  });
}
