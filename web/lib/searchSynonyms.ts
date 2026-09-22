/**
 * Mots courants qu'un utilisateur tape (un métier, un besoin) sans équivalent
 * direct dans la classification de l'annuaire — ni comme libellé de rubrique,
 * ni comme libellé de sous-filtre (cf. FILTER_OPTION_LABEL dans
 * DirectoryClient.tsx). Ex. : aucune fiche n'est classée « quincaillerie »,
 * la rubrique la plus proche est « Maison & équipement ».
 *
 * Chaque entrée ajoute ses `words` comme tokens de recherche supplémentaires
 * aux fiches des rubriques/filtres visés (voir searchTokensById), pour que la
 * recherche libre les retrouve quand même. Ce ne sont que des synonymes vers
 * des rubriques/filtres déjà réels — aucune donnée n'est inventée.
 *
 * Volontairement partielle au départ : à enrichir avec le temps, notamment à
 * partir des recherches qui ne remontent aucun résultat.
 */
export interface SearchSynonym {
  /** Mots déclencheurs (accents/majuscules indifférents, normalisés comme le reste de la recherche). */
  words: string[];
  /** Rubriques (themes) dont les fiches héritent de ces mots. */
  rubriques?: string[];
  /** Sous-filtres (filters) dont les fiches héritent de ces mots. */
  filters?: string[];
}

export const SEARCH_SYNONYMS: SearchSynonym[] = [
  { words: ["quincaillerie"], rubriques: ["maison-equipement"] },
  { words: ["plombier", "plomberie"], rubriques: ["depannages-services"] },
  { words: ["electricien", "electricite"], rubriques: ["depannages-services"] },
  { words: ["serrurier", "serrurerie"], rubriques: ["depannages-services"] },
  { words: ["vitrier"], rubriques: ["depannages-services"] },
  { words: ["peintre", "peinture batiment"], rubriques: ["depannages-services", "maison-equipement"] },
  { words: ["menuisier", "menuiserie"], rubriques: ["depannages-services", "maison-equipement"] },
  { words: ["garagiste"], rubriques: ["auto-garages-concessionnaires"] },
  { words: ["papeterie"], rubriques: ["librairies-jeux-loisirs"] },
  { words: ["poissonnerie", "poissonnier"], rubriques: ["commerces-alimentaires"] },
  { words: ["boucherie", "boucher"], rubriques: ["commerces-alimentaires"] },
  { words: ["epicerie", "epicier"], rubriques: ["commerces-alimentaires"] },
  { words: ["primeur"], rubriques: ["commerces-alimentaires", "marches-produits-locaux"] },
  { words: ["fleuriste"], rubriques: ["souvenirs-cadeaux"] },
];
