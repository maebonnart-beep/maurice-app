"use client";

/**
 * Mapping clé de rubrique/univers/zone → icône Phosphor (trait moderne).
 * Utilisé par les tuiles (CategoryTile) et la boussole des zones à la place des
 * emojis. Repli : `iconForKey` renvoie null si aucune icône n'est mappée
 * (l'appelant peut alors afficher l'emoji d'origine).
 */
import type { Icon } from "@phosphor-icons/react";
import {
  ForkKnife, Martini, Sneaker, ShoppingBag, UsersThree, Briefcase,
  Storefront, CookingPot, Barbell, Waves, Wrench, Sparkle, Recycle, Laptop,
  House, GraduationCap, CalendarBlank, Confetti, PawPrint, TreePalm, Wind,
  PersonSimpleSwim, Boat, Sailboat, Parachute, FishSimple, Golf, Horse,
  TennisBall, PersonSimpleHike, Mountains, Fish, Umbrella, Flower, Bank,
  Buildings, TShirt, Baby, Books, GameController, Gift, Armchair, MapTrifold,
  ChefHat, Wine, PokerChip, BowlingBall, CarProfile, LockKey, FilmSlate,
  Coffee, Hamburger, BeerBottle, Cow, Carrot, Truck, Bread, IceCream, Basket,
  Pizza, Fire, Leaf, Star, Binoculars, FirstAid, Hospital, Stethoscope, Tooth,
  Eyeglasses, TestTube, PoliceCar, Mailbox, ShieldCheck, Money, Pill,
  IdentificationCard, Camera, Taxi, Car, DeviceMobile, WifiHigh, Suitcase,
  Gauge, Scroll, Gavel, Calculator, WashingMachine, Flag, FlowerLotus,
  Scissors, Needle, PersonSimpleTaiChi, Plant, Handshake, Motorcycle, Medal,
  MaskHappy, Coins, Diamond, MapPin, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Target, GlobeHemisphereWest,
  Clock, Phone, EnvelopeSimple, WhatsappLogo, Globe, NavigationArrow, Ruler,
  TrendUp, Ticket, PencilSimple, Compass,
} from "@phosphor-icons/react";

export const ICON_MAP: Record<string, Icon> = {
  // Univers lifestyle
  manger: ForkKnife, sortir: Martini, bouger: Sneaker,
  shopping: ShoppingBag, famille: UsersThree, pratique: Briefcase,
  "se-relaxer": FlowerLotus,

  // Sous-rubriques d'univers (Bouger)
  "bouger-nature": Leaf, "bouger-sports": Barbell,

  // Catégories
  activites: Confetti, food: ForkKnife, utiles: Wrench,
  coaching: Medal, "soins-bien-etre": Sparkle, "seconde-main": Recycle,
  "business-ttv": Laptop, immobilier: House, education: GraduationCap,
  evenements: CalendarBlank,

  // Familles / sous-groupes
  restauration: ForkKnife, commerces: Storefront, cuisines: CookingPot,
  sports: Barbell, "disciplines-nautiques": Waves, "malls-shopping": ShoppingBag,
  "types-shopping": ShoppingBag, particuliers: UsersThree,
  "magasins-occasion": Storefront,

  // Activités & loisirs
  "parcs-animaliers": PawPrint, "parcs-aventures": TreePalm,
  "complexes-sportifs": Barbell, "gym-fitness": Barbell,
  "sports-nautiques": Waves, kitesurf: Wind, "stand-up-paddle": PersonSimpleSwim,
  "navigation-bateau": Boat, "ski-nautique": Boat, surf: Waves, kayak: Sailboat,
  "parachute-ascensionnel": Parachute, "plongee-sous-marine": FishSimple,
  "planche-a-voile": Sailboat, snorkeling: FishSimple, golf: Golf,
  "centres-equestres": Horse, "tennis-padel": TennisBall,
  "randonnee-trail": PersonSimpleHike, "parcs-nationaux-cascades": Mountains,
  peche: Fish, plages: Umbrella, "parcs-botaniques": Flower,
  "culture-patrimoine": Bank, malls: Buildings,
  "mode-adultes": TShirt, "mode-enfants": Baby, "materiel-sports": TennisBall,
  livres: Books, jeux: GameController, souvenirs: Gift,
  "equipement-maison": Armchair, "activites-enfants-famille": Baby,
  "centres-loisirs-animations-enfants": Confetti, excursions: MapTrifold,
  "cours-de-cuisine": ChefHat, rhumeries: Wine, casinos: PokerChip,
  bowling: BowlingBall, karting: CarProfile, "escape-game": LockKey,
  cinemas: FilmSlate, "bibliotheque-mediatheque": Books,

  // Food
  restaurants: ForkKnife, bars: BeerBottle, "cafes-terrasses": Coffee,
  "snacks-plage": Hamburger, "tables-hotes": CookingPot, "chefs-domicile": ChefHat,
  "grandes-surfaces": Basket, "epiceries-specialisees": Basket,
  boucheries: Cow, poissonneries: Fish, "fruits-et-legumes": Carrot,
  marches: Basket, livraisons: Truck, boulangeries: Bread, glaciers: IceCream,
  "produits-francais": Bread, "vins-spiritueux": Wine,
  // Cuisines
  mauricienne: CookingPot, "fruits-de-mer": Fish, indienne: CookingPot,
  asiatique: CookingPot, sushis: Fish, europeenne: ForkKnife, italien: Pizza,
  grillades: Fire, vegetarien: Leaf, "kids-friendly": Baby,
  "tables-exception": Star, "plus-belles-vues": Binoculars,
  "frequente-locaux": UsersThree,

  // Utiles
  "cliniques-privees": FirstAid, "centres-sante-publics": Hospital,
  medecins: Stethoscope, dentistes: Tooth, opticiens: Eyeglasses,
  laboratoires: TestTube, veterinaires: PawPrint, "postes-police": PoliceCar,
  poste: Mailbox, assurances: ShieldCheck, banques: Bank, distributeurs: Money,
  pharmacies: Pill, "expatriation-visas": IdentificationCard,
  photographes: Camera, depannages: Wrench, "informatique-reparation": Laptop,
  "taxis-transferts": Taxi, "location-voiture": Car, "vtc-apps": DeviceMobile,
  telecom: WifiHigh, "plateformes-multiservices": Suitcase,
  "garages-mecaniciens": Wrench, concessionnaires: CarProfile,
  "controle-technique": Gauge, notaires: Scroll, avocats: Gavel,
  comptables: Calculator, "pressing-blanchisserie": WashingMachine,
  "ambassades-consulats": Flag,

  // Coaching
  "sports-bien-etre": Barbell, business: Briefcase,

  // Soins & bien-être
  "spa-instituts": FlowerLotus, coiffeurs: Scissors, "onglerie-manucure": Sparkle,
  barbiers: Scissors, "tatouage-piercing": Needle, "yoga-pilates": PersonSimpleTaiChi,
  "medecine-douce": Plant,

  // Business & TTV
  coworking: Laptop, "cafe-coworking": Coffee, "garde-enfants": Baby,
  networking: Handshake,

  // Seconde main
  "voitures-2-roues": Motorcycle, "habits-adultes": TShirt, "jeux-livres": GameController,
  "eq-maison-particuliers": Armchair, "vetements-particuliers": TShirt,
  "livres-particuliers": Books,

  // Immobilier / éducation / événements
  agences: Buildings, "ecoles-privees-internationales": GraduationCap,
  "creches-garderies": Baby, culturels: MaskHappy, sportifs: Medal,

  // Gammes de prix
  "bon-marche": Coins, "prix-moyen": Money, "se-faire-plaisir": Diamond,

  // Zones (boussole)
  nord: ArrowUp, sud: ArrowDown, est: ArrowRight, ouest: ArrowLeft,
  centre: Target, "toute-lile": GlobeHemisphereWest,
};

/** Icône Phosphor pour une clé, ou null si non mappée. */
export function iconForKey(key: string): Icon | null {
  return ICON_MAP[key] ?? null;
}

/**
 * Icônes thématiques illustrées (images rondes dans public/) pour certaines clés
 * d'univers / catégories. Prioritaires sur les icônes Phosphor dans les tuiles.
 * Les clés sans image (ex. « sortir ») retombent sur l'icône Phosphor.
 */
export const THEMATIC_ICONS: Record<string, string> = {
  // Manger / Food
  manger: "/icon-food.png", food: "/icon-food.png", restauration: "/icon-food.png",
  // Bouger / Sports
  bouger: "/icon-sports.png", sports: "/icon-sports.png", "bouger-sports": "/icon-sports.png",
  // Se relaxer / Loisirs / Nature
  "se-relaxer": "/icon-loisirs.png", activites: "/icon-loisirs.png", "bouger-nature": "/icon-loisirs.png",
  // Shopping
  shopping: "/icon-shopping.png", "malls-shopping": "/icon-shopping.png", "types-shopping": "/icon-shopping.png",
  // Famille
  famille: "/icon-famille.png",
  // Pratique / Utiles
  pratique: "/icon-pratique.png", utiles: "/icon-pratique.png",
  // Enfants (rubriques enfants uniquement ; « kids-friendly » n'est PAS une rubrique
  // ici : c'est un attribut de fiche → géré via le badge Kids Friendly sur la fiche).
  "activites-enfants-famille": "/icon-enfants.png",
  "centres-loisirs-animations-enfants": "/icon-enfants.png",
  education: "/icon-enfants.png",
  // Médecins / santé
  medecins: "/icon-medecins.png",
  // Sortir
  sortir: "/icon-sortir.png",
  // Univers Premium
  evenements: "/icon-evenements.png",
  "seconde-main": "/icon-secondemain.png",
  // Sous-rubriques Sortir
  "snacks-plage": "/icon-snacks-plage.png",
  bars: "/icon-bars.png",
  "culture-patrimoine": "/icon-culture-patrimoine.png",
  "cafes-terrasses": "/icon-cafes-terrasses.png",
  cinemas: "/icon-cinemas.png",
  bowling: "/icon-bowling.png",
  // Sous-rubriques Événements
  sportifs: "/icon-sportifs.png",
  culturels: "/icon-culturels.png",
  // Sous-rubriques Commerces alimentaires (Food)
  "fruits-et-legumes": "/icon-fruits-et-legumes.png",
  boucheries: "/icon-boucheries.png",
  "vins-spiritueux": "/icon-vins-spiritueux.png",
  poissonneries: "/icon-poissonneries.png",
  marches: "/icon-marches.png",
  "produits-francais": "/icon-produits-francais.png",
  boulangeries: "/icon-boulangeries.png",
  "epiceries-specialisees": "/icon-epiceries-specialisees.png",
  livraisons: "/icon-livraisons.png",
  "grandes-surfaces": "/icon-grandes-surfaces.png",
  // Sous-rubriques Restauration (Food)
  restaurants: "/icon-restaurants.png",
  "tables-hotes": "/icon-tables-hotes.png",
  "chefs-domicile": "/icon-chefs-domicile.png",
  glaciers: "/icon-glaciers.png",
};

/** Chemin d'une icône thématique illustrée pour une clé, ou null. */
export function thematicIconFor(key: string): string | null {
  return THEMATIC_ICONS[key] ?? null;
}

/** Rend l'icône d'une clé si mappée (sinon rien) — pratique dans un Tag/badge. */
export function KeyIcon({
  keyName,
  size = 14,
  weight = "bold",
  className,
}: {
  keyName: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}) {
  const I = iconForKey(keyName);
  return I ? <I size={size} weight={weight} className={className} aria-hidden /> : null;
}

// Icônes de contact et de faits chiffrés (fiches).
export const CONTACT_ICONS = { Phone, EnvelopeSimple, WhatsappLogo, Globe, NavigationArrow, MapPin, Clock } as const;
export const FACT_ICONS = {
  distance: Ruler, elevationGain: TrendUp, duration: Clock, entryPrice: Ticket,
  difficultyLevel: PersonSimpleHike, guide: Compass, sports: Barbell,
  restauration: ForkKnife, ttv: Laptop, kids: Baby, sand: Waves, beach: Target,
  animals: PawPrint, golf: Golf, golfDesigner: PencilSimple, golfPricing: Coins,
} as const;

export { MapPin, Clock, Phone, EnvelopeSimple, WhatsappLogo, Globe, NavigationArrow };
