export type ListingStatus = "pending" | "approved" | "rejected" | "expired" | "sold";

export type ListingZone = "nord" | "sud" | "est" | "ouest" | "centre";

export type ListingCategoryKey =
  | "electronique"
  | "meubles"
  | "vetements-adultes"
  | "vetements-enfants"
  | "jeux-livres-enfants"
  | "jeux-livres-adultes"
  | "puericulture"
  | "equipement-maison"
  | "sport-loisirs"
  | "bebe-enfant"
  | "maison-jardin"
  | "vehicules"
  | "autre";

export type ListingCategory = {
  key: ListingCategoryKey;
  label: string;
};

export const LISTING_CATEGORIES: ListingCategory[] = [
  { key: "electronique", label: "Électronique" },
  { key: "meubles", label: "Meubles" },
  { key: "vetements-adultes", label: "Vêtements, chaussures et accessoires adultes" },
  { key: "vetements-enfants", label: "Vêtements et chaussures enfants" },
  { key: "jeux-livres-enfants", label: "Jeux & livres enfants" },
  { key: "jeux-livres-adultes", label: "Jeux & livres adultes" },
  { key: "puericulture", label: "Puériculture" },
  { key: "equipement-maison", label: "Équipement maison" },
  { key: "sport-loisirs", label: "Sport & loisirs" },
  { key: "bebe-enfant", label: "Bébé & enfant" },
  { key: "maison-jardin", label: "Maison & jardin" },
  { key: "vehicules", label: "Véhicules" },
  { key: "autre", label: "Autre" },
];

export type ListingPhoto = {
  id: number;
  listingId: number;
  storagePath: string;
  position: number;
};

export type Listing = {
  id: number;
  userId: string;
  title: string;
  description?: string;
  price?: number;
  category: ListingCategoryKey;
  whatsapp: string;
  zone?: ListingZone;
  status: ListingStatus;
  rejectionReason?: string;
  expiresAt?: string;
  createdAt: string;
  approvedAt?: string;
  photos?: ListingPhoto[];
};

export type Profile = {
  id: string;
  displayName?: string;
  phone?: string;
  isAdmin: boolean;
  isCommunityMember: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: "active" | "past_due" | "canceled" | "none";
  premiumUntil?: string;
  createdAt: string;
};
