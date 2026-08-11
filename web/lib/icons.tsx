"use client";

/**
 * Mapping clé de rubrique/univers/zone → icône Phosphor (trait moderne).
 * Utilisé par les tuiles (CategoryTile) et la boussole des zones à la place des
 * emojis. Repli : `iconForKey` renvoie null si aucune icône n'est mappée
 * (l'appelant peut alors afficher l'emoji d'origine).
 */
import type { Icon } from "@phosphor-icons/react";
import {
  ForkKnife, Martini, PersonSimpleRun, ShoppingBag, UsersThree, Briefcase,
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
  manger: ForkKnife, sortir: Martini, bouger: PersonSimpleRun,
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
