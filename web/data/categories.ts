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
export type FilterGroup = { key: string; label: string; appliesTo: string[]; options: FilterOption[] };

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
    { key: "parcs-activites-famille", label: "Parcs & activités famille", emoji: "🎢" },
    { key: "activites-enfants-famille", label: "Activités enfants & famille", emoji: "🎠" },
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
    { key: "evenements-sportifs", label: "Événements sportifs", emoji: "🏆" },
  ],
};

/** Groupes de filtres transversaux, appliqués à l'intérieur d'une rubrique (ex. cuisine sous "restaurants"). */
export const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "cuisine",
    label: "Cuisine",
    appliesTo: ["restaurants"],
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
];

export const FILTER_GROUP_MAP = Object.fromEntries(FILTER_GROUPS.map((g) => [g.key, g]));

export const PRICE_RANGES: { key: PriceRange; label: string; symbol: string }[] = [
  { key: "bon-marche", label: "Bon marché", symbol: "€" },
  { key: "prix-moyen", label: "Prix moyen", symbol: "€€" },
  { key: "se-faire-plaisir", label: "Se faire plaisir", symbol: "€€€" },
];
