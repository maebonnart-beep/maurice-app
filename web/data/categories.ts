import type { Category } from "@/lib/types";

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
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category["key"], Category>;
