export type CategoryKey =
  | "excursions"
  | "croisieres"
  | "plongee"
  | "nautique"
  | "kitesurf"
  | "peche"
  | "spa"
  | "golf"
  | "loisirs"
  | "visites"
  | "restaurants"
  | "hotels"
  | "shopping";

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
  /** Absent = "free". Premium fiches surface first and unlock the perks below. */
  tier?: BusinessTier;
  /** True once a business owner has claimed/verified this fiche. */
  claimed?: boolean;
  badge?: "partenaire";
  /** Premium perk: direct WhatsApp CTA. Digits/+ only, e.g. "+230..." */
  whatsapp?: string;
  /** Premium perk: short highlighted promo line. */
  promoText?: string;
};
