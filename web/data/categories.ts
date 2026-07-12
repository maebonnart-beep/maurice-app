import type { Category, CategoryKey, PriceRange } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { key: "activites", label: "Activités & loisirs", emoji: "🎡", color: "#ef6a4c" },
  { key: "food", label: "Food", emoji: "🍽️", color: "#d4483f" },
  { key: "utiles", label: "Utiles", emoji: "🧰", color: "#4a6572" },
  { key: "coaching", label: "Coaching", emoji: "🎯", color: "#7c5cf0" },
  { key: "seconde-main", label: "Seconde main", emoji: "♻️", color: "#2e8b57" },
  { key: "evenements", label: "Événements", emoji: "🎉", color: "#e0518a" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category["key"], Category>;

export type Subcategory = { key: string; label: string; emoji: string };

export const SUBCATEGORIES: Partial<Record<CategoryKey, Subcategory[]>> = {
  activites: [
    { key: "parcs-animaliers", label: "Parcs animaliers", emoji: "🦁" },
    { key: "parcs-aventures", label: "Parcs aventures", emoji: "🎢" },
    { key: "complexes-sportifs", label: "Complexes sportifs", emoji: "🏟️" },
    { key: "sports-nautiques", label: "Sports nautiques", emoji: "🏄" },
    { key: "golf", label: "Golf", emoji: "⛳" },
    { key: "randonnee-trail", label: "Randonnée & trail", emoji: "🥾" },
    { key: "peche", label: "Pêche", emoji: "🎣" },
    { key: "balades-familiales", label: "Balades familiales", emoji: "🚶" },
    { key: "plages", label: "Plages", emoji: "🏖️" },
    { key: "parcs-botaniques", label: "Parcs botaniques", emoji: "🌺" },
    { key: "culture-patrimoine", label: "Culture & patrimoine", emoji: "🏛️" },
    { key: "malls-shopping", label: "Malls & shopping", emoji: "🛍️" },
    { key: "activites-enfants-famille", label: "Activités enfants & famille", emoji: "🎠" },
    { key: "centres-loisirs-animations-enfants", label: "Centres de loisirs & animations enfants", emoji: "🤹" },
    { key: "excursions", label: "Excursions", emoji: "🚐" },
    { key: "spa-bien-etre", label: "Spa & bien-être", emoji: "💆" },
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
    { key: "mauricienne", label: "Mauricienne & créole", emoji: "🌶️" },
    { key: "fruits-de-mer", label: "Fruits de mer", emoji: "🦐" },
    { key: "indienne", label: "Indienne", emoji: "🍛" },
    { key: "asiatique", label: "Chinoise & asiatique", emoji: "🥢" },
    { key: "europeenne", label: "Européenne & française", emoji: "🥖" },
    { key: "italien", label: "Italien & pizza", emoji: "🍕" },
    { key: "grecque", label: "Grecque", emoji: "🫒" },
    { key: "marocain", label: "Marocaine", emoji: "🫓" },
    { key: "grillades", label: "Viandes & grillades", emoji: "🥩" },
    { key: "vegetarien", label: "Végétarien", emoji: "🥗" },
    { key: "fastfood", label: "Fast-food & snack", emoji: "🍔" },
    { key: "kids-friendly", label: "Kid's friendly", emoji: "🧒" },
  ],
  utiles: [
    { key: "cliniques-privees", label: "Cliniques privées", emoji: "🏥" },
    { key: "postes-police", label: "Postes de police", emoji: "🚓" },
    { key: "assurances", label: "Assurances", emoji: "🛡️" },
    { key: "banques", label: "Banques", emoji: "🏦" },
    { key: "depannages", label: "Dépannages", emoji: "🔧" },
    { key: "taxis", label: "Taxis", emoji: "🚕" },
    { key: "transferts", label: "Transferts", emoji: "🚖" },
    { key: "bus", label: "Bus", emoji: "🚌" },
    { key: "tram", label: "Tram", emoji: "🚊" },
  ],
  coaching: [
    { key: "sports-bien-etre", label: "Sports & bien-être", emoji: "🏋️" },
    { key: "business", label: "Business", emoji: "💼" },
    { key: "famille", label: "Famille", emoji: "👨‍👩‍👧" },
  ],
  "seconde-main": [
    { key: "equipement-maison", label: "Équipement maison", emoji: "🛋️" },
    { key: "voitures-2-roues", label: "Voitures & 2 roues", emoji: "🚗" },
    { key: "habits-adultes", label: "Habits & chaussures adultes", emoji: "👕" },
    { key: "habits-enfants", label: "Habits & chaussures enfants", emoji: "👶" },
    { key: "jeux-livres", label: "Jeux & livres", emoji: "🎲" },
    { key: "jeux-livres-enfants", label: "Jeux & livres enfants", emoji: "🧸" },
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
