export type FavoriteList = {
  id: number;
  name: string;
  description: string | null;
  emoji: string | null;
  /** Période libre (« Week-end du 12 octobre », « Vacances de Noël »…). */
  period: string | null;
  businessIds: string[];
  /** Note perso par fiche : { businessId: "prendre le curry de poulpe" }. */
  notes: Record<string, string>;
  shareToken: string | null;
  createdAt: string;
};

/** Nombre de listes autorisées sans abonnement premium (vérifié côté API). */
export const FREE_LIST_LIMIT = 2;

/** Colonnes lues par toutes les routes /api/favorite-lists. */
export const LIST_COLUMNS = "id, name, description, emoji, period, business_ids, notes, share_token, created_at";

/** Longueurs max acceptées par l'API (et utilisées en maxLength côté formulaires). */
export const LIST_LIMITS = { name: 60, description: 300, period: 60, note: 280, emoji: 16 } as const;

/** Suggestions d'emoji de couverture proposées à la création/édition. */
export const LIST_EMOJIS = ["🍽️", "🏖️", "🌴", "🥾", "🎉", "👨‍👩‍👧", "☕", "🛍️", "🤿", "🍹", "🏄", "❤️",
  "🧑‍🤝‍🧑", "👨‍👩‍👧‍👦", "🧒", "🧭", "😎", "⛪", "🦐", "🐢", "🏔️", "⛵"];

/**
 * Illustration Koté Moris affichée à la place de chacun des emojis suggérés
 * (planche « Planche DESIGN/ChatGPT Image 25 sept. 2026, 06_09_46.png »,
 * détourée dans public/list-icons/), complétée par la planche du 26/09
 * (« ChatGPT Image 26 sept. 2026, 05_07_27.png »). La colonne `emoji` garde l'emoji : un
 * emoji libre saisi via « Autre » s'affiche tel quel.
 */
export const LIST_ICON_IMAGES: Record<string, string> = {
  "🍽️": "/list-icons/repas.webp",
  "🏖️": "/list-icons/plage.webp",
  "🌴": "/list-icons/palmier.webp",
  "🥾": "/list-icons/rando.webp",
  "🎉": "/list-icons/fete.webp",
  "👨‍👩‍👧": "/list-icons/famille.webp",
  "☕": "/list-icons/cafe.webp",
  "🛍️": "/list-icons/shopping.webp",
  "🤿": "/list-icons/snorkeling.webp",
  "🍹": "/list-icons/cocktail.webp",
  "🏄": "/list-icons/surf.webp",
  "❤️": "/list-icons/coeur.webp",
  "🧑‍🤝‍🧑": "/list-icons/amis.webp",
  "👨‍👩‍👧‍👦": "/list-icons/famille-4.webp",
  "🧒": "/list-icons/enfants.webp",
  "🧭": "/list-icons/carte.webp",
  "😎": "/list-icons/detente.webp",
  "⛪": "/list-icons/patrimoine.webp",
  "🦐": "/list-icons/gastronomie.webp",
  "🐢": "/list-icons/tortue.webp",
  "🏔️": "/list-icons/montagne.webp",
  "⛵": "/list-icons/catamaran.webp",
};

/** Convertit une ligne Supabase (snake_case) en FavoriteList (camelCase). */
export function mapFavoriteListRow(row: Record<string, unknown>): FavoriteList {
  return {
    id: row.id as number,
    name: row.name as string,
    description: (row.description as string) ?? null,
    emoji: (row.emoji as string) ?? null,
    period: (row.period as string) ?? null,
    businessIds: (row.business_ids as string[]) ?? [],
    notes: (row.notes as Record<string, string>) ?? {},
    shareToken: (row.share_token as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export type ListInfo = { name?: string; description?: string; emoji?: string; period?: string };
