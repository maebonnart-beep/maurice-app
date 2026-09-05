import type { Listing } from "./types";

/** Convertit une ligne Supabase (snake_case, avec listing_photos joint) en Listing (camelCase). */
export function mapListingRow(row: Record<string, unknown>): Listing {
  const photos = (row.listing_photos as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as number,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string) ?? undefined,
    price: (row.price as number) ?? undefined,
    category: row.category as Listing["category"],
    whatsapp: row.whatsapp as string,
    zone: (row.zone as Listing["zone"]) ?? undefined,
    status: row.status as Listing["status"],
    rejectionReason: (row.rejection_reason as string) ?? undefined,
    expiresAt: (row.expires_at as string) ?? undefined,
    createdAt: row.created_at as string,
    approvedAt: (row.approved_at as string) ?? undefined,
    photos: photos
      .map((p) => ({
        id: p.id as number,
        listingId: p.listing_id as number,
        storagePath: p.storage_path as string,
        position: p.position as number,
      }))
      .sort((a, b) => a.position - b.position),
  };
}
