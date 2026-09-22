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
  /**
   * Fiches précises héritant de ces mots (id `Business.id`) — pour un besoin qui
   * n'est ni une rubrique ni un sous-filtre mais seulement une spécialité citée
   * dans le descriptif de quelques fiches (ex. « ophtalmologue » : personne n'a
   * de fiche dédiée, seules quelques cliniques pluridisciplinaires le
   * proposent). Identifiées une à une dans les descriptifs existants — aucune
   * fiche n'est inventée, seul le mot de recherche est ajouté.
   */
  businessIds?: string[];
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

  // Objets qu'on cherche à se procurer plutôt qu'un commerce par son nom de
  // métier : renvoie vers les fiches où l'objet peut s'acheter. Les grandes
  // enseignes multi-rayons (Courts Mammouth, Galaxy, China Mall, Conforama…)
  // sont déjà classées en « Maison & équipement », cible principale ici —
  // « high-tech-electromenager » ne compte que 4 fiches (boutiques de
  // téléphonie mobile), pas les gros électroménagers.
  { words: ["tondeuse", "tondeuse a gazon"], rubriques: ["maison-equipement"] },
  { words: ["machine a cafe", "cafetiere"], rubriques: ["maison-equipement"] },
  { words: ["aspirateur"], rubriques: ["maison-equipement"] },
  { words: ["refrigerateur", "frigo", "congelateur"], rubriques: ["maison-equipement"] },
  { words: ["four", "micro-onde", "micro-ondes"], rubriques: ["maison-equipement"] },
  { words: ["lave-linge", "machine a laver", "lave-vaisselle"], rubriques: ["maison-equipement"] },
  { words: ["climatiseur", "climatisation", "ventilateur"], rubriques: ["maison-equipement"] },
  { words: ["perceuse", "visseuse", "tronconneuse", "outillage"], rubriques: ["maison-equipement"] },
  { words: ["barbecue"], rubriques: ["maison-equipement"] },
  { words: ["matelas", "canape", "meuble", "meubles"], rubriques: ["maison-equipement"] },
  { words: ["luminaire", "lampe"], rubriques: ["maison-equipement"] },
  { words: ["tapis", "rideaux"], rubriques: ["maison-equipement"] },
  { words: ["telephone", "smartphone", "portable"], rubriques: ["high-tech-electromenager"] },
  { words: ["ordinateur", "laptop", "imprimante"], rubriques: ["high-tech-electromenager"] },
  { words: ["chaussures", "vetements", "sac a main", "bijoux", "montre"], rubriques: ["mode-accessoires"] },
  { words: ["machine a coudre", "tissu", "laine"], rubriques: ["mercerie-loisirs-creatifs"] },
  { words: ["livre", "jouet", "jeu de societe", "jeux video", "puzzle"], rubriques: ["librairies-jeux-loisirs"] },

  // Spécialités médicales : aucune fiche dédiée par spécialiste (contrairement à
  // « Dentistes »/« Opticiens », qui sont de vrais sous-filtres) — seulement
  // citées dans le descriptif de cliniques pluridisciplinaires. Repérées par
  // recherche du mot dans les descriptifs existants (aucune fiche inventée).
  {
    words: ["ophtalmo", "ophtalmologue", "ophtalmologiste", "ophtalmologie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "wellkin-hospital-moka",
      "city-clinic",
      "la-clinique-mauricienne",
      "chisti-shifa-clinic",
    ],
  },
  {
    words: ["cardiologue", "cardiologie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "wellkin-hospital-moka",
      "clinique-ferriere-curepipe",
      "clinique-de-grand-baie",
      "c-care-grand-baie",
      "centre-medical-du-nord",
      "c-care-tamarin",
      "aegle-clinic",
      "fortis-clinique-darne",
      "city-clinic",
      "la-clinique-mauricienne",
      "chisti-shifa-clinic",
      "medicheck-medical-center",
    ],
  },
  {
    words: ["dermatologue", "dermatologie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "clinique-ferriere-curepipe",
      "prana-skin-laser-clinic-grand-baie",
      "clinique-de-grand-baie",
      "c-care-grand-baie",
      "centre-medical-du-nord",
      "c-care-tamarin",
      "aegle-clinic",
      "chisti-shifa-clinic",
    ],
  },
  {
    words: ["gynecologue", "gynecologie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "wellkin-hospital-moka",
      "clinique-ferriere-curepipe",
      "clinique-de-grand-baie",
      "c-care-grand-baie",
      "clinique-de-l-occident",
      "clinic-de-l-occident",
      "life-medical-clinic-tamarin",
      "c-care-tamarin",
      "life-viva",
      "aegle-clinic",
      "fortis-clinique-darne",
      "city-clinic",
      "la-clinique-mauricienne",
      "chisti-shifa-clinic",
    ],
  },
  {
    words: ["pediatre", "pediatrie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "wellkin-hospital-moka",
      "clinique-ferriere-curepipe",
      "clinique-de-grand-baie",
      "c-care-grand-baie",
      "c-care-tamarin",
      "bel-air-mediclinic",
      "aegle-clinic",
      "fortis-clinique-darne",
      "la-clinique-mauricienne",
      "chisti-shifa-clinic",
    ],
  },
  {
    words: ["kinesitherapeute", "kine", "kinesitherapie"],
    businessIds: [
      "life-medical-clinic-tamarin",
      "flic-en-flac-community-health-centre",
      "felix-mace-physiotherapist",
      "stella-maris-clinic",
      "w-life-health-wellness-center",
      "medicheck-medical-center",
      "clinic-de-l-occident",
      "cabinet-antoine-menguy-petit-raffray",
    ],
  },
  {
    words: ["gastro-enterologue", "gastroenterologue", "gastro-enterologie"],
    businessIds: [
      "wellkin-hospital-moka",
      "clinique-ferriere-curepipe",
      "life-medical-clinic-tamarin",
      "premium-care-clinic-phoenix",
      "la-clinique-mauricienne",
    ],
  },
  {
    words: ["neurologue", "neurologie"],
    businessIds: ["wellkin-hospital-moka", "c-care-tamarin", "premium-care-clinic-phoenix", "aegle-clinic"],
  },
  {
    words: ["urologue", "urologie"],
    businessIds: [
      "wellkin-hospital-moka",
      "clinique-de-grand-baie",
      "life-medical-clinic-tamarin",
      "c-care-tamarin",
      "life-viva",
      "premium-care-clinic-phoenix",
      "aegle-clinic",
    ],
  },
  {
    words: ["psychiatre", "psychiatrie"],
    businessIds: ["clinique-ferriere-curepipe", "c-care-tamarin", "bel-air-mediclinic"],
  },
  {
    words: ["radiologue", "radiologie"],
    businessIds: [
      "clinique-du-nord-baie-du-tombeau",
      "c-care-grand-baie",
      "centre-medical-du-nord",
      "clinique-de-l-occident",
      "clinic-de-l-occident",
      "c-care-tamarin",
      "bel-air-mediclinic",
      "lady-sushil-ramgoolam-belvedere-medi-clinic",
      "premium-care-clinic-phoenix",
      "aegle-clinic",
      "fortis-clinique-darne",
      "city-clinic",
    ],
  },
  {
    words: ["osteopathe", "osteopathie"],
    businessIds: [
      "life-medical-clinic-tamarin",
      "synergy-sport-and-wellness-institute",
      "w-life-health-wellness-center",
      "cabinet-d-osteopathie-gossart-motte-soins",
      "l-l-osteopathie-soins",
    ],
  },
  { words: ["podologue", "podologie"], businessIds: ["synergy-sport-and-wellness-institute"] },
];
