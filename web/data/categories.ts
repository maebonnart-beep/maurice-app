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
  { key: "hotels", label: "Bars & restaurants d'hôtels", emoji: "🏨", color: "#8e4585" },
  { key: "shopping", label: "Shopping & boutiques", emoji: "🛍️", color: "#9c7a3c" },
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
  ],
};
SUBCATEGORIES.hotels = SUBCATEGORIES.restaurants;

export const PRICE_RANGES: { key: PriceRange; label: string; symbol: string }[] = [
  { key: "bon-marche", label: "Bon marché", symbol: "€" },
  { key: "prix-moyen", label: "Prix moyen", symbol: "€€" },
  { key: "se-faire-plaisir", label: "Se faire plaisir", symbol: "€€€" },
];
