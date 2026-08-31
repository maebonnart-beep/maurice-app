import type { Category, CategoryKey, PriceRange } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { key: "manger-boire", label: "Manger & boire", emoji: "🍽️", color: "#d4483f" },
  { key: "sortir-decouvrir", label: "Sortir & découvrir", emoji: "🎡", color: "#ef6a4c" },
  { key: "faire-du-sport", label: "Faire du sport", emoji: "🏃", color: "#2e8b57" },
  { key: "sante-bien-etre", label: "Santé & bien-être", emoji: "💆", color: "#c9457a" },
  { key: "acheter-equiper", label: "Acheter & s'équiper", emoji: "🛍️", color: "#b07d48" },
  { key: "vie-pratique", label: "Vie pratique", emoji: "🧰", color: "#4a6572" },
  { key: "famille-travail", label: "Famille & Travail", emoji: "🧑‍💼", color: "#7c5cf0" },
  { key: "agenda", label: "Agenda", emoji: "🎉", color: "#e0518a" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category["key"], Category>;

export type Subcategory = { key: string; label: string; emoji: string };

export type FilterOption = { key: string; label: string; emoji: string };
export type FilterGroup = {
  key: string;
  label: string;
  appliesTo: string[];
  options: FilterOption[];
  /** Affiché comme une page de sous-rubriques cliquables (en plus des chips de filtre), pas juste un filtre transversal. */
  browsable?: boolean;
};

export const SUBCATEGORIES: Partial<Record<CategoryKey, Subcategory[]>> = {
  "manger-boire": [
    { key: "restaurants", label: "Restaurants", emoji: "🍽️" },
    { key: "cafes-bars-glaciers", label: "Cafés, bars & glaciers", emoji: "☕" },
    { key: "tables-hotes-chefs-domicile", label: "Tables d'hôtes & chefs à domicile", emoji: "🍲" },
    { key: "commerces-alimentaires", label: "Commerces alimentaires", emoji: "🛒" },
    { key: "marches-produits-locaux", label: "Marchés & produits locaux", emoji: "🥭" },
    { key: "livraisons", label: "Livraisons", emoji: "🚚" },
  ],
  "sortir-decouvrir": [
    { key: "excursions-sorties", label: "Excursions & sorties", emoji: "🚐" },
    { key: "culture-patrimoine", label: "Culture & patrimoine", emoji: "🏛️" },
    { key: "plages-nature", label: "Plages & nature", emoji: "🏖️" },
    { key: "parcs-activites-famille", label: "Activités nature en famille (parcs et réserves)", emoji: "🎢" },
    { key: "activites-enfants-famille", label: "Activités famille indoor & urbain", emoji: "🎠" },
    { key: "casinos-loisirs", label: "Casinos & loisirs", emoji: "🎰" },
    { key: "cinemas", label: "Cinémas", emoji: "🎬" },
  ],
  "faire-du-sport": [
    { key: "salles-sport-fitness", label: "Salles de sport & fitness", emoji: "💪" },
    { key: "tennis-padel", label: "Tennis & padel", emoji: "🎾" },
    { key: "golf", label: "Golf", emoji: "⛳" },
    { key: "randonnee-trail", label: "Randonnée & trail", emoji: "🥾" },
    { key: "sports-nautiques", label: "Sports nautiques", emoji: "🏄" },
    { key: "equitation-autres-sports", label: "Équitation & autres sports", emoji: "🐴" },
  ],
  "sante-bien-etre": [
    { key: "medecins-soins", label: "Médecins & soins", emoji: "🩺" },
    { key: "pharmacies-laboratoires", label: "Pharmacies & laboratoires", emoji: "💊" },
    { key: "cliniques-hopitaux", label: "Cliniques & hôpitaux", emoji: "🏥" },
    { key: "spa-instituts-massages", label: "Spa, instituts & massages", emoji: "🧖‍♀️" },
    { key: "coiffeurs-barbiers-beaute", label: "Coiffeurs, barbiers & beauté", emoji: "💇" },
    { key: "yoga-bien-etre", label: "Yoga & pratiques bien-être", emoji: "🧘" },
    { key: "veterinaires", label: "Vétérinaires", emoji: "🐾" },
  ],
  "acheter-equiper": [
    { key: "malls-shopping", label: "Malls & shopping", emoji: "🏬" },
    { key: "mode-accessoires", label: "Mode & accessoires", emoji: "👗" },
    { key: "maison-equipement", label: "Maison & équipement", emoji: "🛋️" },
    { key: "high-tech-electromenager", label: "High-tech & électroménager", emoji: "📱" },
    { key: "librairies-jeux-loisirs", label: "Librairies, jeux & loisirs", emoji: "📚" },
    { key: "souvenirs-cadeaux", label: "Souvenirs & cadeaux", emoji: "🎁" },
    { key: "seconde-main-boutiques", label: "Seconde main (boutiques)", emoji: "🏪" },
    { key: "seconde-main-particuliers", label: "Seconde main (particuliers)", emoji: "🙋" },
  ],
  "vie-pratique": [
    { key: "banques-assurances-argent", label: "Banques, assurances & argent", emoji: "🏦" },
    { key: "poste-demarches", label: "Poste & démarches", emoji: "📮" },
    { key: "police-ambassades-consulats", label: "Police, ambassades & consulats", emoji: "🚓" },
    { key: "avocats-notaires-comptables", label: "Avocats, notaires & comptables", emoji: "⚖️" },
    { key: "telecom-internet", label: "Télécom & internet", emoji: "📶" },
    { key: "auto-garages-concessionnaires", label: "Auto (garages, concessionnaires & contrôle)", emoji: "🔧" },
    { key: "taxis-vtc-location", label: "Taxis, VTC & location", emoji: "🚕" },
    { key: "depannages-services", label: "Dépannages & services", emoji: "🔧" },
    { key: "immobilier", label: "Immobilier", emoji: "🏘️" },
  ],
  "famille-travail": [
    { key: "creches-garderies", label: "Crèches & garderies", emoji: "👶" },
    { key: "ecoles", label: "Écoles", emoji: "🎒" },
    { key: "centres-loisirs-animations", label: "Centres de loisirs & animations", emoji: "🤹" },
    { key: "coworking-teletravail", label: "Coworking & télétravail", emoji: "🧑‍💻" },
    { key: "business-networking", label: "Business & networking", emoji: "🤝" },
  ],
  "agenda": [
    { key: "evenements-culturels", label: "Événements culturels", emoji: "🎭" },
    { key: "evenements-associatifs", label: "Événements associatifs", emoji: "🤝" },
    { key: "evenements-sportifs", label: "Événements sportifs", emoji: "🏆" },
  ],
};

/** Groupes de filtres transversaux, appliqués à l'intérieur d'une rubrique (ex. cuisine sous "restaurants"). */
export const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "cuisine",
    label: "Cuisine",
    appliesTo: ["restaurants"],
    browsable: true,
    options: [
      { key: "mauricienne", label: "Mauricienne & créole", emoji: "🌶️" },
      { key: "fruits-de-mer", label: "Fruits de mer", emoji: "🦐" },
      { key: "indienne", label: "Indienne", emoji: "🍛" },
      { key: "asiatique", label: "Chinoise & asiatique", emoji: "🥢" },
      { key: "sushis", label: "Sushis", emoji: "🍣" },
      { key: "europeenne", label: "Européenne & française", emoji: "🥖" },
      { key: "italien", label: "Italien & pizza", emoji: "🍕" },
      { key: "grillades", label: "Viandes & grillades", emoji: "🥩" },
      { key: "vegetarien", label: "Végétarien", emoji: "🥗" },
    ],
  },
  {
    key: "cuisine-livraison",
    label: "Type de cuisine",
    appliesTo: ["livraisons"],
    options: [
      { key: "mauricienne", label: "Mauricienne & créole", emoji: "🌶️" },
      { key: "fruits-de-mer", label: "Fruits de mer", emoji: "🦐" },
      { key: "indienne", label: "Indienne", emoji: "🍛" },
      { key: "asiatique", label: "Chinoise & asiatique", emoji: "🥢" },
      { key: "sushis", label: "Sushis", emoji: "🍣" },
      { key: "europeenne", label: "Européenne & française", emoji: "🥖" },
      { key: "italien", label: "Italien & pizza", emoji: "🍕" },
      { key: "grillades", label: "Viandes & grillades", emoji: "🥩" },
      { key: "vegetarien", label: "Végétarien", emoji: "🥗" },
    ],
  },
  {
    key: "ambiance-public",
    label: "Ambiance / public",
    appliesTo: ["restaurants"],
    options: [
      { key: "kids-friendly", label: "Kid's friendly", emoji: "🧒" },
      { key: "tables-exception", label: "Tables d'exception", emoji: "🏆" },
      { key: "plus-belles-vues", label: "Plus belles vues", emoji: "🌅" },
      { key: "frequente-locaux", label: "Fréquenté par les locaux", emoji: "👥" },
    ],
  },
  {
    key: "discipline-nautique",
    label: "Discipline",
    appliesTo: ["sports-nautiques"],
    browsable: true,
    options: [
      { key: "kitesurf", label: "Kitesurf", emoji: "🪁" },
      { key: "stand-up-paddle", label: "Stand Up Paddle", emoji: "🏄‍♀️" },
      { key: "navigation-bateau", label: "Navigation bateau", emoji: "⛵" },
      { key: "ski-nautique", label: "Ski nautique", emoji: "🚤" },
      { key: "surf", label: "Surf", emoji: "🏄‍♂️" },
      { key: "kayak", label: "Kayak", emoji: "🛶" },
      { key: "parachute-ascensionnel", label: "Parachute ascensionnel", emoji: "🪂" },
      { key: "plongee-sous-marine", label: "Plongée sous-marine", emoji: "🤿" },
      { key: "planche-a-voile", label: "Planche à voile", emoji: "🌬️" },
      { key: "snorkeling", label: "Snorkeling", emoji: "🐠" },
    ],
  },
  {
    key: "specialite-origine",
    label: "Spécialité",
    appliesTo: ["commerces-alimentaires"],
    options: [
      { key: "produits-francais", label: "Produits français", emoji: "🇫🇷" },
      { key: "produits-locaux", label: "Produits locaux", emoji: "🥭" },
      { key: "epiceries-fines", label: "Épiceries fines", emoji: "🫙" },
      { key: "produits-bio", label: "Produits bio", emoji: "🌱" },
      { key: "boucheries-poissons", label: "Boucheries & poissons", emoji: "🥩" },
      { key: "boulangeries-patisseries", label: "Boulangeries & pâtisseries", emoji: "🥖" },
      { key: "vins-spiritueux", label: "Vins & spiritueux", emoji: "🍷" },
      { key: "exotiques-epices", label: "Exotiques & épices", emoji: "🌶️" },
    ],
  },
  {
    key: "specialite-repas",
    label: "Spécialité",
    appliesTo: ["restaurants", "livraisons"],
    options: [
      { key: "produits-francais", label: "Produits français", emoji: "🇫🇷" },
      { key: "produits-locaux", label: "Produits locaux", emoji: "🥭" },
      { key: "epiceries-fines", label: "Épiceries fines", emoji: "🫙" },
      { key: "produits-bio", label: "Produits bio", emoji: "🌱" },
      { key: "boucheries-poissons", label: "Boucheries & poissons", emoji: "🥩" },
      { key: "boulangeries-patisseries", label: "Boulangeries & pâtisseries", emoji: "🥖" },
      { key: "vins-spiritueux", label: "Vins & spiritueux", emoji: "🍷" },
      { key: "exotiques-epices", label: "Exotiques & épices", emoji: "🌶️" },
    ],
  },

  // --- Sous-rubriques restaurées (perdues lors de la refonte du 17/08/2026) ---
  {
    key: "commerces-alimentaires-types",
    label: "Type de commerce",
    appliesTo: ["commerces-alimentaires"],
    browsable: true,
    options: [
      { key: "grandes-surfaces", label: "Grandes surfaces alimentaires", emoji: "🏬" },
      { key: "boulangeries", label: "Boulangerie, pâtisseries & petit snacking", emoji: "🥐" },
      { key: "epiceries-specialisees", label: "Épiceries spécialisées", emoji: "🧺" },
      { key: "boucheries", label: "Boucheries", emoji: "🥩" },
      { key: "fruits-et-legumes", label: "Fruits & légumes", emoji: "🥬" },
      { key: "poissonneries", label: "Poissonneries", emoji: "🐟" },
      { key: "marches", label: "Marchés", emoji: "🥭" },
    ],
  },
  {
    key: "cafes-bars-types",
    label: "Type d'établissement",
    appliesTo: ["cafes-bars-glaciers"],
    browsable: true,
    options: [
      { key: "bars", label: "Bars", emoji: "🍹" },
      { key: "cafes-terrasses", label: "Cafés & terrasses", emoji: "☕" },
      { key: "snacks-plage", label: "Snacks de plage", emoji: "🥙" },
      { key: "glaciers", label: "Glaciers", emoji: "🍦" },
    ],
  },
  {
    key: "tables-hotes-types",
    label: "Type de prestation",
    appliesTo: ["tables-hotes-chefs-domicile"],
    browsable: true,
    options: [
      { key: "tables-hotes", label: "Tables d'hôtes", emoji: "🍲" },
      { key: "chefs-domicile", label: "Chefs à domicile", emoji: "👨‍🍳" },
      { key: "cours-de-cuisine", label: "Cours de cuisine", emoji: "👨‍🍳" },
    ],
  },
  {
    key: "plages-nature-types",
    label: "Type de site",
    appliesTo: ["plages-nature"],
    browsable: true,
    options: [
      { key: "plages", label: "Plages", emoji: "🏖️" },
      { key: "parcs-nationaux-cascades", label: "Parcs nationaux & cascades", emoji: "🏞️" },
      { key: "parcs-botaniques", label: "Parcs botaniques", emoji: "🌺" },
    ],
  },
  {
    key: "parcs-activites-famille-types",
    label: "Type de parc",
    appliesTo: ["parcs-activites-famille"],
    browsable: true,
    options: [
      { key: "parcs-animaliers", label: "Parcs animaliers", emoji: "🦁" },
      { key: "parcs-aventures", label: "Parcs aventures", emoji: "🎢" },
    ],
  },
  {
    key: "excursions-iles-destination",
    label: "Île de destination",
    appliesTo: ["excursions-sorties"],
    browsable: true,
    options: [
      { key: "ile-aux-cerfs", label: "Île aux Cerfs", emoji: "🦌" },
      { key: "ile-aux-benitiers", label: "Île aux Bénitiers", emoji: "🏝️" },
      { key: "gabriel-island", label: "Gabriel Island", emoji: "🏝️" },
      { key: "coin-de-mire", label: "Coin de Mire", emoji: "🗿" },
      { key: "flat-island", label: "Flat Island (Île Plate)", emoji: "🏝️" },
      { key: "ilot-mangenie", label: "Ilot Mangénie", emoji: "🏝️" },
      { key: "ile-aux-aigrettes", label: "Île aux Aigrettes", emoji: "🐦" },
      { key: "ile-aux-deux-cocos", label: "Île aux Deux Cocos", emoji: "🥥" },
      { key: "ile-de-la-passe", label: "Île de la Passe", emoji: "🏝️" },
      { key: "ile-aux-phares", label: "Île aux Phares", emoji: "🗼" },
      { key: "ile-d-ambre", label: "Île d'Ambre & Îlot Bernache", emoji: "🏝️" },
    ],
  },
  {
    key: "casinos-loisirs-types",
    label: "Type de loisir",
    appliesTo: ["casinos-loisirs"],
    browsable: true,
    options: [
      { key: "casinos", label: "Casinos", emoji: "🎰" },
      { key: "bowling", label: "Bowling", emoji: "🎳" },
      { key: "karting", label: "Karting", emoji: "🏎️" },
      { key: "escape-game", label: "Escape games", emoji: "🧩" },
    ],
  },
  {
    key: "salles-sport-types",
    label: "Type de structure",
    appliesTo: ["salles-sport-fitness"],
    browsable: true,
    options: [
      { key: "gym-fitness", label: "Gym & fitness", emoji: "💪" },
      { key: "complexes-sportifs", label: "Complexes sportifs", emoji: "🏟️" },
    ],
  },
  {
    key: "equitation-autres-types",
    label: "Type d'activité",
    appliesTo: ["equitation-autres-sports"],
    browsable: true,
    options: [
      { key: "peche", label: "Pêche", emoji: "🎣" },
      { key: "centres-equestres", label: "Centres équestres", emoji: "🐴" },
    ],
  },
  {
    key: "medecins-soins-types",
    label: "Spécialité",
    appliesTo: ["medecins-soins"],
    browsable: true,
    options: [
      { key: "medecins", label: "Médecins & généralistes", emoji: "🩺" },
      { key: "dentistes", label: "Dentistes", emoji: "🦷" },
      { key: "opticiens", label: "Opticiens", emoji: "👓" },
    ],
  },
  {
    key: "pharmacies-labs-types",
    label: "Type",
    appliesTo: ["pharmacies-laboratoires"],
    browsable: true,
    options: [
      { key: "pharmacies", label: "Pharmacies", emoji: "💊" },
      { key: "laboratoires", label: "Laboratoires d'analyses", emoji: "🔬" },
    ],
  },
  {
    key: "cliniques-types",
    label: "Type",
    appliesTo: ["cliniques-hopitaux"],
    browsable: true,
    options: [
      { key: "cliniques-privees", label: "Cliniques privées", emoji: "🏥" },
      { key: "centres-sante-publics", label: "Centres de santé publics", emoji: "⚕️" },
    ],
  },
  {
    key: "coiffeurs-types",
    label: "Type de prestation",
    appliesTo: ["coiffeurs-barbiers-beaute"],
    browsable: true,
    options: [
      { key: "coiffeurs", label: "Coiffeurs", emoji: "💇" },
      { key: "barbiers", label: "Barbiers", emoji: "💈" },
      { key: "onglerie-manucure", label: "Onglerie & manucure", emoji: "💅" },
      { key: "tatouage-piercing", label: "Tatouage & piercing", emoji: "🖋️" },
    ],
  },
  {
    key: "mode-accessoires-types",
    label: "Type de boutique",
    appliesTo: ["mode-accessoires"],
    browsable: true,
    options: [
      { key: "mode-adultes", label: "Mode adultes", emoji: "👗" },
      { key: "mode-enfants", label: "Mode enfants", emoji: "🧒" },
      { key: "beaute", label: "Beauté & parfums", emoji: "💄" },
      { key: "materiel-sports", label: "Matériel de sports", emoji: "🏸" },
    ],
  },
  {
    key: "librairies-jeux-types",
    label: "Type de boutique",
    appliesTo: ["librairies-jeux-loisirs"],
    browsable: true,
    options: [
      { key: "livres", label: "Librairies", emoji: "📚" },
      { key: "jeux", label: "Jeux", emoji: "🎲" },
      { key: "bibliotheque-mediatheque", label: "Bibliothèque & médiathèque", emoji: "📚" },
    ],
  },
  {
    key: "seconde-main-boutiques-types",
    label: "Type de boutique",
    appliesTo: ["seconde-main-boutiques"],
    browsable: true,
    options: [
      { key: "voitures-2-roues", label: "Voitures & 2 roues", emoji: "🚗" },
      { key: "habits-adultes", label: "Habits & chaussures adultes", emoji: "👕" },
      { key: "equipement-maison", label: "Équipement maison", emoji: "🛋️" },
      { key: "jeux-livres", label: "Jeux & livres", emoji: "🎲" },
    ],
  },
  {
    key: "banques-types",
    label: "Type de service",
    appliesTo: ["banques-assurances-argent"],
    browsable: true,
    options: [
      { key: "banques", label: "Banques", emoji: "🏦" },
      { key: "assurances", label: "Assurances", emoji: "🛡️" },
      { key: "distributeurs", label: "Distributeurs (ATM)", emoji: "🏧" },
    ],
  },
  {
    key: "poste-demarches-types",
    label: "Type de service",
    appliesTo: ["poste-demarches"],
    browsable: true,
    options: [
      { key: "poste", label: "Bureaux de poste", emoji: "📮" },
      { key: "expatriation-visas", label: "Expatriation & visas", emoji: "🛂" },
      { key: "photographes", label: "Photographes (passeport & ID)", emoji: "📷" },
    ],
  },
  {
    key: "police-ambassades-types",
    label: "Type",
    appliesTo: ["police-ambassades-consulats"],
    browsable: true,
    options: [
      { key: "postes-police", label: "Postes de police", emoji: "🚓" },
      { key: "ambassades-consulats", label: "Ambassades & consulats", emoji: "🏛️" },
    ],
  },
  {
    key: "avocats-types",
    label: "Profession",
    appliesTo: ["avocats-notaires-comptables"],
    browsable: true,
    options: [
      { key: "avocats", label: "Avocats & juristes", emoji: "⚖️" },
      { key: "notaires", label: "Notaires", emoji: "📜" },
      { key: "comptables", label: "Comptables & experts-comptables", emoji: "🧮" },
    ],
  },
  {
    key: "auto-types",
    label: "Type de service",
    appliesTo: ["auto-garages-concessionnaires"],
    browsable: true,
    options: [
      { key: "concessionnaires", label: "Concessionnaires auto", emoji: "🚗" },
      { key: "garages-mecaniciens", label: "Garages & mécaniciens", emoji: "🔧" },
      { key: "controle-technique", label: "Contrôle technique (fitness)", emoji: "🛠️" },
    ],
  },
  {
    key: "taxis-types",
    label: "Type de service",
    appliesTo: ["taxis-vtc-location"],
    browsable: true,
    options: [
      { key: "taxis-transferts", label: "Taxis & transferts", emoji: "🚕" },
      { key: "location-voiture", label: "Location de voiture", emoji: "🚙" },
      { key: "vtc-apps", label: "Applications VTC & réservation", emoji: "📱" },
    ],
  },
  {
    key: "depannages-types",
    label: "Type de service",
    appliesTo: ["depannages-services"],
    browsable: true,
    options: [
      { key: "depannages", label: "Dépannages", emoji: "🔧" },
      { key: "informatique-reparation", label: "Informatique (dépannage & pièces)", emoji: "💻" },
      { key: "pressing-blanchisserie", label: "Pressing & blanchisserie", emoji: "🧺" },
    ],
  },
  {
    key: "coworking-types",
    label: "Type d'espace",
    appliesTo: ["coworking-teletravail"],
    browsable: true,
    options: [
      { key: "coworking", label: "Espaces de coworking", emoji: "🧑‍💻" },
      { key: "cafe-coworking", label: "Cafés & spots télétravail", emoji: "☕" },
    ],
  },
  {
    key: "business-networking-types",
    label: "Type",
    appliesTo: ["business-networking"],
    browsable: true,
    options: [
      { key: "business", label: "Business", emoji: "💼" },
      { key: "networking", label: "Networking", emoji: "🤝" },
    ],
  },
  {
    key: "type-evenement",
    label: "Type d'événement",
    appliesTo: ["evenements-culturels", "evenements-sportifs", "evenements-associatifs"],
    browsable: true,
    options: [
      { key: "concert", label: "Concerts", emoji: "🎤" },
      { key: "festival", label: "Festivals", emoji: "🎪" },
      { key: "spectacle-comedie", label: "Spectacles & comédies musicales", emoji: "🎭" },
      { key: "clubbing-soiree", label: "Clubbing & soirées", emoji: "🪩" },
      { key: "culturel-traditionnel", label: "Fêtes traditionnelles & religieuses", emoji: "🛕" },
      { key: "sportif", label: "Sportifs", emoji: "🏆" },
      { key: "associatif-caritatif", label: "Associatifs & caritatifs", emoji: "🤝" },
      { key: "culinaire", label: "Gourmands", emoji: "🍴" },
    ],
  },
];

export const FILTER_GROUP_MAP = Object.fromEntries(FILTER_GROUPS.map((g) => [g.key, g]));

export const PRICE_RANGES: { key: PriceRange; label: string; symbol: string }[] = [
  { key: "bon-marche", label: "Bon marché", symbol: "€" },
  { key: "prix-moyen", label: "Prix moyen", symbol: "€€" },
  { key: "se-faire-plaisir", label: "Se faire plaisir", symbol: "€€€" },
];
