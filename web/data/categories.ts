import type { Category, CategoryKey, PriceRange } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { key: "activites", label: "Activités & loisirs", emoji: "🎡", color: "#ef6a4c" },
  { key: "food", label: "Food", emoji: "🍽️", color: "#d4483f" },
  { key: "utiles", label: "Utiles", emoji: "🧰", color: "#4a6572" },
  { key: "coaching", label: "Coaching", emoji: "🎯", color: "#7c5cf0" },
  { key: "soins-bien-etre", label: "Soins et Bien-être", emoji: "💆", color: "#c9457a" },
  { key: "seconde-main", label: "Seconde main", emoji: "♻️", color: "#2e8b57" },
  { key: "business-ttv", label: "Business & TTV", emoji: "💻", color: "#1f8a9b" },
  { key: "immobilier", label: "Immobilier", emoji: "🏠", color: "#b07d48" },
  { key: "evenements", label: "Événements", emoji: "🎉", color: "#e0518a" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category["key"], Category>;

export type Subcategory = { key: string; label: string; emoji: string };

export type Subgroup = { key: string; label: string; emoji: string; parent: string; children: string[] };

export type Family = {
  key: string;
  label: string;
  emoji: string;
  children: string[];
  /** Sous-groupes nichés sous un thème précis de `children` (ex: cuisines sous "restaurants"). */
  subgroups?: Subgroup[];
  /** "end" affiche ce groupe après toutes les rubriques non groupées, au lieu de l'ordre de déclaration. */
  position?: "end";
};

export const FAMILIES: Partial<Record<CategoryKey, Family[]>> = {
  food: [
    {
      key: "restauration",
      label: "Restauration",
      emoji: "🍽️",
      children: [
        "restaurants", "bars", "cafes-terrasses", "snacks-plage", "tables-hotes", "chefs-domicile",
        "glaciers",
      ],
      subgroups: [
        {
          key: "cuisines",
          label: "Cuisines",
          emoji: "🌍",
          parent: "restaurants",
          children: [
            "mauricienne", "fruits-de-mer", "indienne", "asiatique", "sushis", "europeenne",
            "italien", "grillades", "vegetarien", "kids-friendly", "tables-exception",
            "plus-belles-vues", "frequente-locaux",
          ],
        },
      ],
    },
    {
      key: "commerces",
      label: "Commerces",
      emoji: "🛒",
      children: [
        "grandes-surfaces", "epiceries-specialisees", "boucheries", "poissonneries", "marches",
        "livraisons", "boulangeries", "produits-francais", "vins-spiritueux",
      ],
    },
  ],
  activites: [
    {
      key: "sports",
      label: "Sports",
      emoji: "🏃",
      children: [
        "complexes-sportifs", "golf", "randonnee-trail", "sports-nautiques",
        "centres-equestres", "tennis-padel", "gym-fitness",
      ],
      subgroups: [
        {
          key: "disciplines-nautiques",
          label: "Disciplines",
          emoji: "🌊",
          parent: "sports-nautiques",
          children: [
            "kitesurf", "stand-up-paddle", "navigation-bateau", "ski-nautique", "surf", "kayak",
            "parachute-ascensionnel", "plongee-sous-marine", "planche-a-voile", "snorkeling",
          ],
        },
      ],
    },
    {
      key: "malls-shopping",
      label: "Malls & shopping",
      emoji: "🛍️",
      position: "end",
      children: ["malls", "shopping"],
      subgroups: [
        {
          key: "types-shopping",
          label: "Types de shopping",
          emoji: "🛒",
          parent: "shopping",
          children: [
            "mode-adultes", "mode-enfants", "materiel-sports", "livres", "jeux", "souvenirs",
            "equipement-maison",
          ],
        },
      ],
    },
  ],
  "seconde-main": [
    {
      key: "particuliers",
      label: "Particuliers",
      emoji: "🙋",
      children: ["eq-maison-particuliers", "vetements-particuliers", "livres-particuliers"],
    },
    {
      key: "magasins-occasion",
      label: "Magasins d'occasion",
      emoji: "🏪",
      children: [
        "equipement-maison", "voitures-2-roues", "habits-adultes",
        "jeux-livres",
      ],
    },
  ],
};

export const SUBCATEGORIES: Partial<Record<CategoryKey, Subcategory[]>> = {
  activites: [
    { key: "parcs-animaliers", label: "Parcs animaliers", emoji: "🦁" },
    { key: "parcs-aventures", label: "Parcs aventures", emoji: "🎢" },
    { key: "complexes-sportifs", label: "Complexes sportifs", emoji: "🏟️" },
    { key: "gym-fitness", label: "Gym & fitness", emoji: "💪" },
    { key: "sports-nautiques", label: "Sports nautiques", emoji: "🏄" },
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
    { key: "golf", label: "Golf", emoji: "⛳" },
    { key: "centres-equestres", label: "Centres équestres", emoji: "🐴" },
    { key: "tennis-padel", label: "Tennis & padel", emoji: "🎾" },
    { key: "randonnee-trail", label: "Randonnée & trail", emoji: "🥾" },
    { key: "parcs-nationaux-cascades", label: "Parcs nationaux & cascades", emoji: "🏞️" },
    { key: "peche", label: "Pêche", emoji: "🎣" },
    { key: "plages", label: "Plages", emoji: "🏖️" },
    { key: "parcs-botaniques", label: "Parcs botaniques", emoji: "🌺" },
    { key: "culture-patrimoine", label: "Culture & patrimoine", emoji: "🏛️" },
    { key: "malls", label: "Malls", emoji: "🏬" },
    { key: "shopping", label: "Shopping", emoji: "🛍️" },
    { key: "mode-adultes", label: "Mode adultes", emoji: "👗" },
    { key: "mode-enfants", label: "Mode enfants", emoji: "🧒" },
    { key: "materiel-sports", label: "Matériel de sports", emoji: "🏸" },
    { key: "livres", label: "Librairies", emoji: "📚" },
    { key: "jeux", label: "Jeux", emoji: "🎲" },
    { key: "souvenirs", label: "Souvenirs", emoji: "🎁" },
    { key: "equipement-maison", label: "Équipement maison", emoji: "🛋️" },
    { key: "activites-enfants-famille", label: "Activités enfants & famille", emoji: "🎠" },
    { key: "centres-loisirs-animations-enfants", label: "Centres de loisirs & animations enfants", emoji: "🤹" },
    { key: "excursions", label: "Excursions", emoji: "🚐" },
    { key: "cours-de-cuisine", label: "Cours de cuisine", emoji: "👨‍🍳" },
    { key: "casinos", label: "Casinos", emoji: "🎰" },
    { key: "bowling", label: "Bowling", emoji: "🎳" },
    { key: "cinemas", label: "Cinémas", emoji: "🎬" },
    { key: "bibliotheque-mediatheque", label: "Bibliothèque & médiathèque", emoji: "📚" },
  ],
  food: [
    { key: "restaurants", label: "Restaurants", emoji: "🍽️" },
    { key: "bars", label: "Bars", emoji: "🍹" },
    { key: "cafes-terrasses", label: "Cafés & terrasses", emoji: "☕" },
    { key: "snacks-plage", label: "Snacks de plage", emoji: "🥙" },
    { key: "tables-hotes", label: "Tables d'hôtes", emoji: "🍲" },
    { key: "chefs-domicile", label: "Chefs à domicile", emoji: "👨‍🍳" },
    { key: "grandes-surfaces", label: "Grandes surfaces alimentaires", emoji: "🏬" },
    { key: "epiceries-specialisees", label: "Épiceries spécialisées", emoji: "🧺" },
    { key: "boucheries", label: "Boucheries", emoji: "🥩" },
    { key: "poissonneries", label: "Poissonneries", emoji: "🐟" },
    { key: "marches", label: "Marchés", emoji: "🥭" },
    { key: "livraisons", label: "Livraisons", emoji: "🚚" },
    { key: "boulangeries", label: "Boulangerie, pâtisseries & petit snacking", emoji: "🥐" },
    { key: "glaciers", label: "Glaciers", emoji: "🍦" },
    { key: "produits-francais", label: "Produits français", emoji: "🇫🇷" },
    { key: "vins-spiritueux", label: "Vins & spiritueux", emoji: "🍷" },
    { key: "mauricienne", label: "Mauricienne & créole", emoji: "🌶️" },
    { key: "fruits-de-mer", label: "Fruits de mer", emoji: "🦐" },
    { key: "indienne", label: "Indienne", emoji: "🍛" },
    { key: "asiatique", label: "Chinoise & asiatique", emoji: "🥢" },
    { key: "sushis", label: "Sushis", emoji: "🍣" },
    { key: "europeenne", label: "Européenne & française", emoji: "🥖" },
    { key: "italien", label: "Italien & pizza", emoji: "🍕" },
    { key: "grillades", label: "Viandes & grillades", emoji: "🥩" },
    { key: "vegetarien", label: "Végétarien", emoji: "🥗" },
    { key: "kids-friendly", label: "Kid's friendly", emoji: "🧒" },
    { key: "tables-exception", label: "Tables d'exception", emoji: "🏆" },
    { key: "plus-belles-vues", label: "Plus belles vues", emoji: "🌅" },
    { key: "frequente-locaux", label: "Fréquenté par les locaux", emoji: "👥" },
  ],
  utiles: [
    { key: "cliniques-privees", label: "Cliniques privées", emoji: "🏥" },
    { key: "centres-sante-publics", label: "Centres de santé publics", emoji: "⚕️" },
    { key: "medecins", label: "Médecins & généralistes", emoji: "🩺" },
    { key: "dentistes", label: "Dentistes", emoji: "🦷" },
    { key: "opticiens", label: "Opticiens", emoji: "👓" },
    { key: "laboratoires", label: "Laboratoires d'analyses", emoji: "🔬" },
    { key: "veterinaires", label: "Vétérinaires", emoji: "🐾" },
    { key: "postes-police", label: "Postes de police", emoji: "🚓" },
    { key: "poste", label: "Poste", emoji: "📮" },
    { key: "assurances", label: "Assurances", emoji: "🛡️" },
    { key: "banques", label: "Banques", emoji: "🏦" },
    { key: "distributeurs", label: "Distributeurs (ATM)", emoji: "🏧" },
    { key: "pharmacies", label: "Pharmacies", emoji: "💊" },
    { key: "expatriation-visas", label: "Expatriation & visas", emoji: "🛂" },
    { key: "photographes", label: "Photographes (passeport & ID)", emoji: "📷" },
    { key: "depannages", label: "Dépannages", emoji: "🔧" },
    { key: "taxis-transferts", label: "Taxis & transferts", emoji: "🚕" },
    { key: "vtc-apps", label: "Applications VTC & réservation", emoji: "📱" },
    { key: "plateformes-multiservices", label: "Plateformes multiservices & touristiques", emoji: "🧳" },
  ],
  coaching: [
    { key: "sports-bien-etre", label: "Sports & bien-être", emoji: "🏋️" },
    { key: "business", label: "Business", emoji: "💼" },
    { key: "famille", label: "Famille", emoji: "👨‍👩‍👧" },
  ],
  "soins-bien-etre": [
    { key: "spa-instituts", label: "Spa et instituts", emoji: "🧖‍♀️" },
    { key: "coiffeurs", label: "Coiffeurs", emoji: "💇" },
  ],
  "business-ttv": [
    { key: "coworking", label: "Espaces de coworking", emoji: "🧑‍💻" },
    { key: "cafe-coworking", label: "Cafés & spots télétravail", emoji: "☕" },
    { key: "garde-enfants", label: "Coworking + garde enfants", emoji: "👶" },
    { key: "networking", label: "Networking", emoji: "🤝" },
  ],
  "seconde-main": [
    { key: "equipement-maison", label: "Équipement maison", emoji: "🛋️" },
    { key: "voitures-2-roues", label: "Voitures & 2 roues", emoji: "🚗" },
    { key: "habits-adultes", label: "Habits & chaussures adultes", emoji: "👕" },
    { key: "jeux-livres", label: "Jeux & livres", emoji: "🎲" },
    { key: "eq-maison-particuliers", label: "Équipement maison", emoji: "🛋️" },
    { key: "vetements-particuliers", label: "Vêtements", emoji: "👕" },
    { key: "livres-particuliers", label: "Livres", emoji: "📚" },
  ],
  immobilier: [
    { key: "agences", label: "Agences immobilières", emoji: "🏘️" },
  ],
  evenements: [
    { key: "sportifs", label: "Sportifs", emoji: "🏆" },
    { key: "culturels", label: "Culturels", emoji: "🎭" },
    { key: "business", label: "Business", emoji: "💼" },
  ],
};

export const PRICE_RANGES: { key: PriceRange; label: string; symbol: string }[] = [
  { key: "bon-marche", label: "Bon marché", symbol: "€" },
  { key: "prix-moyen", label: "Prix moyen", symbol: "€€" },
  { key: "se-faire-plaisir", label: "Se faire plaisir", symbol: "€€€" },
];
