import type { Category, CategoryKey, PriceRange } from "@/lib/types";

export const CATEGORIES: Category[] = [
  { key: "excursions", label: "Excursions & tours", emoji: "🚐", color: "#e8873a" },
  { key: "croisieres", label: "Croisières & bateau", emoji: "⛵", color: "#2f7de0" },
  { key: "plongee", label: "Plongée", emoji: "🤿", color: "#0e8b84" },
  { key: "nautique", label: "Sports nautiques", emoji: "🏄", color: "#14b8c4" },
  { key: "kitesurf", label: "Kitesurf", emoji: "🪁", color: "#7c5cf0" },
  { key: "peche", label: "Pêche au gros", emoji: "🎣", color: "#2b9348" },
  { key: "spa", label: "Spa & bien-être", emoji: "💆", color: "#e0518a" },
  { key: "golf", label: "Golf", emoji: "⛳", color: "#6a8f1f" },
  { key: "loisirs", label: "Loisirs & famille", emoji: "🎡", color: "#ef6a4c" },
  { key: "visites", label: "Visites guidées", emoji: "🗺️", color: "#a15c3a" },
  { key: "restaurants", label: "Restaurants & bars", emoji: "🍽️", color: "#d4483f" },
  { key: "shopping", label: "Shopping & boutiques", emoji: "🛍️", color: "#9c7a3c" },
  { key: "alimentation", label: "Food shops", emoji: "🛒", color: "#2e8b57" },
  { key: "randonnees", label: "Balades & randonnées", emoji: "🥾", color: "#6b4423" },
  { key: "tables-hotes", label: "Tables d'hôtes", emoji: "🍲", color: "#b8860b" },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category["key"], Category>;

export type Subcategory = { key: string; label: string; emoji: string };

export const SUBCATEGORIES: Partial<Record<CategoryKey, Subcategory[]>> = {
  restaurants: [
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
    { key: "bar", label: "Bar & lounge", emoji: "🍹" },
    { key: "cafe", label: "Café & pâtisserie", emoji: "☕" },
    { key: "kids-friendly", label: "Kid's friendly", emoji: "🧒" },
    { key: "chefs-domicile-traiteurs", label: "Chefs à domicile & traiteurs", emoji: "👨‍🍳" },
    { key: "snacks-plage", label: "Snacks de plage", emoji: "🥙" },
  ],
  alimentation: [
    { key: "hypermarches", label: "Hypermarchés", emoji: "🏬" },
    { key: "supermarches", label: "Supermarchés", emoji: "🏪" },
    { key: "superettes-epiceries", label: "Supérettes & épiceries", emoji: "🧺" },
    { key: "marches", label: "Marchés", emoji: "🥭" },
    { key: "livraison-domicile", label: "Livraisons à domicile", emoji: "🚚" },
    { key: "boucherie", label: "Boucherie", emoji: "🥩" },
    { key: "poissonnerie", label: "Poissonnerie", emoji: "🐟" },
    { key: "boulangerie-patisserie", label: "Boulangerie, pâtisseries & petit snacking", emoji: "🥐" },
    { key: "vins-bieres-spiritueux", label: "Vins, bières et spiritueux", emoji: "🍷" },
  ],
  randonnees: [
    { key: "montagnes", label: "Montagnes", emoji: "⛰️" },
    { key: "cascades", label: "Cascades", emoji: "💦" },
    { key: "forets", label: "Forêts", emoji: "🌳" },
    { key: "sentiers-cotiers", label: "Sentiers côtiers", emoji: "🌊" },
    { key: "reserves-naturelles", label: "Réserves naturelles", emoji: "🦌" },
    { key: "points-de-vue", label: "Points de vue", emoji: "📸" },
    { key: "randonnee-guidee", label: "Randonnée guidée", emoji: "🧭" },
  ],
  visites: [
    { key: "parcs-animaliers", label: "Parcs animaliers", emoji: "🦁" },
    { key: "parcs-attractions", label: "Parcs d'attractions", emoji: "🎢" },
    { key: "musees-patrimoine", label: "Musées & patrimoine", emoji: "🏛️" },
    { key: "jardins", label: "Jardins", emoji: "🌺" },
    { key: "sites-naturels", label: "Sites naturels", emoji: "⛰️" },
  ],
  loisirs: [
    { key: "plages", label: "Plages", emoji: "🏖️" },
  ],
};
SUBCATEGORIES["tables-hotes"] = SUBCATEGORIES.restaurants;

export const PRICE_RANGES: { key: PriceRange; label: string; symbol: string }[] = [
  { key: "bon-marche", label: "Bon marché", symbol: "€" },
  { key: "prix-moyen", label: "Prix moyen", symbol: "€€" },
  { key: "se-faire-plaisir", label: "Se faire plaisir", symbol: "€€€" },
];
