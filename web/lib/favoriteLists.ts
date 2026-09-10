export type FavoriteList = {
  id: number;
  name: string;
  businessIds: string[];
  shareToken: string | null;
  createdAt: string;
};

/** Convertit une ligne Supabase (snake_case) en FavoriteList (camelCase). */
export function mapFavoriteListRow(row: Record<string, unknown>): FavoriteList {
  return {
    id: row.id as number,
    name: row.name as string,
    businessIds: (row.business_ids as string[]) ?? [],
    shareToken: (row.share_token as string) ?? null,
    createdAt: row.created_at as string,
  };
}
