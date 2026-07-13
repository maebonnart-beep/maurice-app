export type CategoryKey =
  | "activites"
  | "food"
  | "utiles"
  | "coaching"
  | "seconde-main"
  | "evenements";

export type Category = {
  key: CategoryKey;
  label: string;
  emoji: string;
  color: string;
};

export type BusinessTier = "free" | "premium";

export type PriceRange = "bon-marche" | "prix-moyen" | "se-faire-plaisir";

export type Business = {
  id: string;
  name: string;
  category: CategoryKey;
  address: string;
  phone: string;
  website: string;
  googleMapsUrl: string;
  lat: number;
  lng: number;
  themes?: string[];
  /** Texte libre combinant jours + heures, ex: "Lun-Ven 11h30-22h, Sam-Dim 11h-23h". */
  hours?: string;
  priceRange?: PriceRange;
  /** Uniquement pertinent pour les fiches "restaurants" (thème food). */
  takeaway?: boolean;
  /** Absent = "free". Premium fiches surface first and unlock the perks below. */
  tier?: BusinessTier;
  /** True once a business owner has claimed/verified this fiche. */
  claimed?: boolean;
  badge?: "partenaire" | "coup-de-coeur" | "selection";
  /** Premium perk: direct WhatsApp CTA. Digits/+ only, e.g. "+230..." */
  whatsapp?: string;
  /** Premium perk: short highlighted promo line. */
  promoText?: string;
};
