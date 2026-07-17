export type CategoryKey =
  | "activites"
  | "food"
  | "utiles"
  | "coaching"
  | "seconde-main"
  | "business-ttv"
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
  email?: string;
  website: string;
  /** Absent pour les fiches sans point sur la carte (ex: applis/plateformes sans adresse physique). */
  googleMapsUrl?: string;
  /** lat/lng absents = fiche affichée dans la liste mais sans marqueur sur la carte (ex: applis/plateformes). */
  lat?: number;
  lng?: number;
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
  /** Descriptif rapide (1-2 phrases). Surtout utilisé pour parcs-aventures. */
  description?: string;
  /** Prix d'entrée en texte libre, ex: "Rs 450 adulte / Rs 250 enfant". Parcs-aventures, parcs-animaliers. */
  entryPrice?: string;
  /** Durée moyenne/approximative de l'activité, ex: "2h30". Parcs-aventures, randonnée-trail. */
  duration?: string;
  /** Niveau de pratique. Randonnée-trail. */
  difficultyLevel?: "debutant" | "habitue" | "confirme";
  /** Présence d'un guide conseillée. Randonnée-trail. */
  guideRecommended?: boolean;
  /** Sports/activités disponibles sur place, texte libre. Complexes-sportifs. */
  sportsListed?: string;
  /** Restauration sur place. Complexes-sportifs. */
  hasRestauration?: boolean;
  /** Adapté télétravail (wifi, prises, espace calme). Complexes-sportifs. */
  ttvFriendly?: boolean;
  /** Activités enfants sur place. Complexes-sportifs. */
  kidsActivities?: boolean;
  /** Type de sable, texte libre ex: "sable blanc fin". Plages. */
  sandType?: string;
  /** Activités praticables sur la plage, texte libre. Plages. */
  beachActivities?: string;
  /** Longueur approximative de la plage, ex: "1.5 km". Plages. */
  beachLength?: string;
  /** Types d'animaux visibles, texte libre. Parcs-animaliers. */
  animalsVisible?: string;
  /** Nombre de trous. Golf. */
  golfHoles?: number;
  /** Prix du practice et/ou du parcours, texte libre. Golf. */
  golfPricing?: string;
  /** Par du parcours. Golf. */
  golfPar?: number;
  /** Longueur du parcours, texte libre ex: "6505m". Golf. */
  golfLength?: string;
  /** Designer(s) du parcours, texte libre. Golf. */
  golfDesigner?: string;
  /** Zone géographique de l'île. Absent pour les fiches sans localisation physique (apps/plateformes). */
  zone?: "nord" | "sud" | "est" | "ouest" | "centre";
  /** URL d'une photo libre de droits (Unsplash/Pexels...) illustrant la fiche. */
  photoUrl?: string;
  /** Crédit/source de la photo, ex: "Photo: Jane Doe / Unsplash". */
  photoCredit?: string;
};
