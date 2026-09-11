/** Durée de vie d'une annonce approuvée avant passage automatique en "expired". */
export const LISTING_TTL_DAYS = 21;

/** Nombre d'annonces actives (pending + approved) autorisées par utilisateur premium. */
export const MAX_ACTIVE_LISTINGS = 10;

export const PREMIUM_PRICE_LABEL = "Rs 199/mois";
export const PREMIUM_PRICE_LABEL_ANNUAL = "Rs 1 499/an";
export const PREMIUM_PRICE_LABEL_EUR = "3,99€/mois";
export const PREMIUM_PRICE_LABEL_ANNUAL_EUR = "27,99€/an";

export const LISTING_PHOTOS_BUCKET = "listing-photos";

/** URL publique d'une photo d'annonce à partir de son storage_path (bucket public en lecture). */
export function listingPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${LISTING_PHOTOS_BUCKET}/${storagePath}`;
}

export const AVATAR_BUCKET = "avatars";

/** URL publique d'une photo de profil à partir de son storage_path (bucket public en lecture). */
export function avatarUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${storagePath}`;
}
