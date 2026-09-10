import type { SavedSearch } from "./types";

/** Convertit une ligne Supabase (snake_case) en SavedSearch (camelCase). */
export function mapSavedSearchRow(row: Record<string, unknown>): SavedSearch {
  return {
    id: row.id as number,
    userId: row.user_id as string,
    type: row.type as SavedSearch["type"],
    label: row.label as string,
    criteria: (row.criteria as SavedSearch["criteria"]) ?? {},
    createdAt: row.created_at as string,
  };
}
