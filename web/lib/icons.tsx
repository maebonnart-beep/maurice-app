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
  Target, GlobeHemisphereWest, Jar,
  Clock, Phone, EnvelopeSimple, WhatsappLogo, Globe, NavigationArrow, Ruler,
  TrendUp, Ticket, PencilSimple, Compass,
} from "@phosphor-icons/react";

export const ICON_MAP: Record<string, Icon> = {
  // Catégories (8)
  "manger-boire": ForkKnife, "sortir-decouvrir": Confetti, "faire-du-sport": Barbell,
  "sante-bien-etre": Sparkle, "acheter-equiper": ShoppingBag, "vie-pratique": Wrench,
  "famille-travail": Briefcase, agenda: CalendarBlank,

  // Rubriques — Manger & boire
  restaurants: ForkKnife, "cafes-bars-glaciers": Coffee,
  "tables-hotes-chefs-domicile": CookingPot, "commerces-alimentaires": Basket,
  "marches-produits-locaux": Basket, livraisons: Truck,

  // Rubriques — Sortir & découvrir
  "excursions-sorties": MapTrifold, "culture-patrimoine": Bank,
  "plages-nature": Umbrella, "parcs-activites-famille": TreePalm,
  "activites-enfants-famille": Baby, "casinos-loisirs": PokerChip, cinemas: FilmSlate,

  // Rubriques — Faire du sport
  "salles-sport-fitness": Barbell, "tennis-padel": TennisBall, golf: Golf,
  "randonnee-trail": PersonSimpleHike, "sports-nautiques": Waves,
  "equitation-autres-sports": Horse,
  // Filtres — discipline nautique
  kitesurf: Wind, "stand-up-paddle": PersonSimpleSwim, "navigation-bateau": Boat,
  "ski-nautique": Boat, surf: Waves, kayak: Sailboat,
  "parachute-ascensionnel": Parachute, "plongee-sous-marine": FishSimple,
  "planche-a-voile": Sailboat, snorkeling: FishSimple,

  // Rubriques — Santé & bien-être
  "medecins-soins": Stethoscope, "pharmacies-laboratoires": Pill,
  "cliniques-hopitaux": Hospital, "spa-instituts-massages": FlowerLotus,
  "coiffeurs-barbiers-beaute": Scissors, "yoga-bien-etre": PersonSimpleTaiChi,
  veterinaires: PawPrint,

  // Rubriques — Acheter & s'équiper
  "malls-shopping": Buildings, "mode-accessoires": TShirt,
  "maison-equipement": Armchair, "high-tech-electromenager": DeviceMobile,
  "librairies-jeux-loisirs": Books, "souvenirs-cadeaux": Gift,
  "seconde-main-boutiques": Storefront, "seconde-main-particuliers": Recycle,

  // Rubriques — Vie pratique
  "banques-assurances-argent": Bank, "poste-demarches": Mailbox,
  "police-ambassades-consulats": PoliceCar, "avocats-notaires-comptables": Gavel,
  "telecom-internet": WifiHigh, "auto-garages-concessionnaires": Wrench,
  "taxis-vtc-location": Taxi, "depannages-services": Wrench, immobilier: House,

  // Rubriques — Famille & Travail
  "creches-garderies": Baby, ecoles: GraduationCap,
  "centres-loisirs-animations": Confetti, "coworking-teletravail": Laptop,
  "business-networking": Handshake,

  // Rubriques — Agenda
  "evenements-culturels": MaskHappy, "evenements-sportifs": Medal,

  // Filtres — Cuisine
  mauricienne: CookingPot, "fruits-de-mer": Fish, indienne: CookingPot,
  asiatique: CookingPot, sushis: Fish, europeenne: ForkKnife, italien: Pizza,
  grillades: Fire, vegetarien: Leaf,
  // Filtres — Ambiance / public
  "kids-friendly": Baby, "tables-exception": Star, "plus-belles-vues": Binoculars,
  "frequente-locaux": UsersThree,
  // Filtres — Spécialité
  "produits-francais": Bread, "produits-locaux": Basket, "epiceries-fines": Jar,
  "produits-bio": Plant, "boucheries-poissons": Cow, "boulangeries-patisseries": Bread,
  "vins-spiritueux": Wine, "exotiques-epices": Fire,

  // Sous-rubriques restaurées (perdues lors de la refonte du 17/08/2026)
  "grandes-surfaces": Storefront, boulangeries: Bread, "epiceries-specialisees": Basket,
  boucheries: Cow, "fruits-et-legumes": Carrot, poissonneries: Fish, marches: Basket,
  bars: Martini, "cafes-terrasses": Coffee, "snacks-plage": Hamburger, glaciers: IceCream,
  "tables-hotes": CookingPot, "chefs-domicile": ChefHat, "cours-de-cuisine": ChefHat,
  plages: Umbrella, "parcs-nationaux-cascades": Mountains, "parcs-botaniques": Flower,
  "parcs-animaliers": PawPrint, "parcs-aventures": TreePalm,
  casinos: PokerChip, bowling: BowlingBall, karting: Gauge, "escape-game": LockKey,
  "gym-fitness": Barbell, "complexes-sportifs": Buildings,
  peche: FishSimple, "centres-equestres": Horse,
  medecins: Stethoscope, dentistes: Tooth, opticiens: Eyeglasses,
  pharmacies: Pill, laboratoires: TestTube,
  "cliniques-privees": Hospital, "centres-sante-publics": FirstAid,
  coiffeurs: Scissors, barbiers: Scissors, "onglerie-manucure": Sparkle, "tatouage-piercing": Needle,
  "mode-adultes": TShirt, "mode-enfants": Baby, beaute: Sparkle, "materiel-sports": Sneaker,
  livres: Books, jeux: GameController, "bibliotheque-mediatheque": Books,
  "voitures-2-roues": Motorcycle, "habits-adultes": TShirt, "equipement-maison": Armchair, "jeux-livres": GameController,
  banques: Bank, assurances: ShieldCheck, distributeurs: Money,
  poste: Mailbox, "expatriation-visas": IdentificationCard, photographes: Camera,
  "postes-police": PoliceCar, "ambassades-consulats": Flag,
  avocats: Gavel, notaires: Scroll, comptables: Calculator,
  concessionnaires: Car, "garages-mecaniciens": Wrench, "controle-technique": Ruler,
  "taxis-transferts": Taxi, "location-voiture": Car, "vtc-apps": DeviceMobile,
  depannages: Wrench, "informatique-reparation": Laptop, "pressing-blanchisserie": WashingMachine,
  coworking: Laptop, "cafe-coworking": Coffee,
  business: Briefcase, networking: Handshake,

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
  manger: "/icon-home-manger.png", food: "/icon-food.png", restauration: "/icon-food.png",
  // Bouger / Sports
  bouger: "/icon-home-bouger.png", sports: "/icon-sports.png", "bouger-sports": "/icon-sports.png",
  // Se relaxer / Loisirs / Nature
  "se-relaxer": "/icon-loisirs.png", activites: "/icon-loisirs.png", "bouger-nature": "/icon-nature.png",
  // Shopping
  shopping: "/icon-home-shopping.png", "malls-shopping": "/icon-shopping.png", "types-shopping": "/icon-shopping.png",
  // Famille
  famille: "/icon-famille.png",
  // Pratique / Utiles
  pratique: "/icon-home-pratique.png", utiles: "/icon-pratique.png",
  // Univers Santé & Bien-être (placeholder en attendant l'harmonisation des icônes)
  "sante-bien-etre": "/icon-home-sante.png",
  // Univers Famille (rubriques + sous-rubriques education). « kids-friendly » est
  // aussi affiché comme rubrique dans l'univers Famille (cf. DirectoryClient).
  "activites-enfants-famille": "/icon-activites-enfants-famille.png",
  "centres-loisirs-animations-enfants": "/icon-centres-loisirs-animations-enfants.png",
  "creches-garderies": "/icon-creches-garderies.png",
  "ecoles-privees-internationales": "/icon-ecoles-privees-internationales.png",
  "kids-friendly": "/icon-kids-friendly.png",
  education: "/icon-enfants.png",
  // Médecins / santé
  medecins: "/icon-medecins.png",
  // Sortir
  sortir: "/icon-home-sortir.png",
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
  "cours-de-cuisine": "/icon-cours-de-cuisine.png",
  glaciers: "/icon-glaciers.png",
  // Sous-rubriques Sports (Bouger)
  "gym-fitness": "/icon-gym-fitness.png",
  "sports-nautiques": "/icon-sports-nautiques.png",
  "complexes-sportifs": "/icon-complexes-sportifs.png",
  "tennis-padel": "/icon-tennis-padel.png",
  golf: "/icon-golf.png",
  "centres-equestres": "/icon-centres-equestres.png",
  // Sous-rubriques Nature (Bouger)
  excursions: "/icon-excursions.png",
  peche: "/icon-peche.png",
  "randonnee-trail": "/icon-randonnee-trail.png",
  "parcs-nationaux-cascades": "/icon-parcs-nationaux-cascades.png",
  plages: "/icon-plages.png",
  "parcs-botaniques": "/icon-parcs-botaniques.png",
  "parcs-animaliers": "/icon-parcs-animaliers.png",
  "parcs-aventures": "/icon-parcs-aventures.png",
  // Sous-rubriques Sortir (nouvelles ; culture-patrimoine/cinemas/bowling déjà mappées)
  casinos: "/icon-casinos.png",
  rhumeries: "/icon-rhumeries.png",
  karting: "/icon-karting.png",
  "escape-game": "/icon-escape-game.png",
  // Rubriques générales — Pratique (Utiles)
  poste: "/icon-poste.png",
  "taxis-transferts": "/icon-taxis-transferts.png",
  concessionnaires: "/icon-concessionnaires.png",
  assurances: "/icon-assurances.png",
  telecom: "/icon-telecom.png",
  distributeurs: "/icon-distributeurs.png",
  agences: "/icon-agences.png",
  "location-voiture": "/icon-location-voiture.png",
  "postes-police": "/icon-postes-police.png",
  banques: "/icon-banques.png",
  depannages: "/icon-depannages.png",
  "informatique-reparation": "/icon-informatique-reparation.png",
  "garages-mecaniciens": "/icon-garages-mecaniciens.png",
  "vtc-apps": "/icon-vtc-apps.png",
  "pressing-blanchisserie": "/icon-pressing-blanchisserie.png",
  "plateformes-multiservices": "/icon-plateformes-multiservices.png",
  "controle-technique": "/icon-controle-technique.png",
  // Rubriques générales — Santé (medecins déjà mappée)
  pharmacies: "/icon-pharmacies.png",
  "cliniques-privees": "/icon-cliniques-privees.png",
  opticiens: "/icon-opticiens.png",
  dentistes: "/icon-dentistes.png",
  laboratoires: "/icon-laboratoires.png",
  veterinaires: "/icon-veterinaires.png",
  "centres-sante-publics": "/icon-centres-sante-publics.png",
  // Rubriques générales — Soins & bien-être + coaching
  "spa-instituts": "/icon-spa-instituts.png",
  "sports-bien-etre": "/icon-sports-bien-etre.png",
  "onglerie-manucure": "/icon-onglerie-manucure.png",
  coiffeurs: "/icon-coiffeurs.png",
  "medecine-douce": "/icon-medecine-douce.png",
  barbiers: "/icon-barbiers.png",
  "yoga-pilates": "/icon-yoga-pilates.png",
  "tatouage-piercing": "/icon-tatouage-piercing.png",
  // Rubriques générales — Expatriation
  "expatriation-visas": "/icon-expatriation-visas.png",
  photographes: "/icon-photographes.png",
  // Rubriques générales — Business
  coworking: "/icon-coworking.png",
  business: "/icon-business.png",
  comptables: "/icon-comptables.png",
  "cafe-coworking": "/icon-cafe-coworking.png",
  networking: "/icon-networking.png",
  avocats: "/icon-avocats.png",
  notaires: "/icon-notaires.png",
  // Ajouts : catégorie parente Commerces (Manger) + Ambassades (Utiles)
  commerces: "/icon-commerces.png",
  "ambassades-consulats": "/icon-ambassades-consulats.png",
  // Sous-rubriques Shopping
  malls: "/icon-malls.png",
  "mode-adultes": "/icon-mode-adultes.png",
  "mode-enfants": "/icon-mode-enfants.png",
  "materiel-sports": "/icon-materiel-sports.png",
  livres: "/icon-livres.png",
  jeux: "/icon-jeux.png",
  souvenirs: "/icon-souvenirs.png",
  "equipement-maison": "/icon-equipement-maison.png",
  beaute: "/icon-shopping-beaute.png",
  electromenager: "/icon-shopping-electromenager.png",
  "high-tech": "/icon-high-tech.png",
  // Tuiles de groupe sous Manger (niveau intermédiaire)
  "manger-restauration": "/icon-restauration.png",
  "manger-commerces": "/icon-commerces-alimentaires.png",
  // Tuiles de groupe sous Santé & Bien-être
  "sbe-sante": "/icon-sbe-sante.png",
  "sbe-soins": "/icon-sbe-soins.png",
  // Tuiles de groupe sous Se divertir
  "sortir-ambiance": "/icon-sortir-ambiance.png",
  "sortir-loisirs": "/icon-sortir-loisirs.png",
  "sortir-culture": "/icon-sortir-culture.png",
  // Tuiles de groupe sous Vie pratique
  "pratique-demarches": "/icon-pratique-demarches.png",
  "pratique-auto-maison": "/icon-pratique-auto-maison.png",
  "pratique-immo-pro": "/icon-pratique-immo-pro.png",
  "pratique-famille": "/icon-pratique-famille.png",
};

/** Chemin d'une icône thématique illustrée pour une clé, ou null. */
export function thematicIconFor(key: string): string | null {
  return THEMATIC_ICONS[key] ?? null;
}

/**
 * Clés de rubriques (SUBCATEGORIES) couvertes par une icône illustrée
 * (public/subicons/{key}.png), style pictogramme plat simple (planche V4).
 * Une entrée par rubrique de la nouvelle taxonomie à 8 catégories — cf.
 * web/data/categories.ts.
 */
const SUBICON_KEYS = new Set([
  // Manger & boire
  "restaurants", "cafes-bars-glaciers", "tables-hotes-chefs-domicile",
  "commerces-alimentaires", "marches-produits-locaux", "livraisons",
  // Sortir & découvrir
  "excursions-sorties", "culture-patrimoine", "plages-nature",
  "parcs-activites-famille", "activites-enfants-famille", "casinos-loisirs", "cinemas",
  // Faire du sport
  "salles-sport-fitness", "tennis-padel", "golf", "randonnee-trail",
  "sports-nautiques", "equitation-autres-sports",
  // Santé & bien-être
  "medecins-soins", "pharmacies-laboratoires", "cliniques-hopitaux",
  "spa-instituts-massages", "coiffeurs-barbiers-beaute", "yoga-bien-etre", "veterinaires",
  // Acheter & s'équiper
  "malls-shopping", "mode-accessoires", "maison-equipement",
  "high-tech-electromenager", "librairies-jeux-loisirs", "souvenirs-cadeaux",
  "seconde-main-boutiques", "seconde-main-particuliers",
  // Vie pratique
  "banques-assurances-argent", "poste-demarches", "police-ambassades-consulats",
  "avocats-notaires-comptables", "telecom-internet", "auto-garages-concessionnaires",
  "taxis-vtc-location", "depannages-services", "immobilier",
  // Famille & Travail
  "creches-garderies", "ecoles", "centres-loisirs-animations",
  "coworking-teletravail", "business-networking",
  // Agenda
  "evenements-culturels", "evenements-sportifs",
]);

/** Chemin de l'icône découpée pour une rubrique, ou null si pas encore couverte. */
export function subIconFor(key: string): string | null {
  return SUBICON_KEYS.has(key) ? `/subicons/${key}.png` : null;
}

/**
 * Clés des 8 catégories couvertes par une mascotte poulpe illustrée
 * (public/mascots/{key}.png), détourée depuis les planches de la cliente.
 */
const MASCOT_KEYS = new Set([
  "manger-boire", "sortir-decouvrir", "faire-du-sport", "sante-bien-etre",
  "acheter-equiper", "vie-pratique", "famille-travail", "agenda",
]);

/** Chemin de la mascotte poulpe illustrée pour une catégorie (niveau 1), ou null. */
export function mascotFor(key: string): string | null {
  return MASCOT_KEYS.has(key) ? `/mascots/${key}.png` : null;
}

/**
 * Fond pastel par catégorie (niveau 1) pour les badges ronds de mascotte sur
 * l'accueil — un ton distinct par catégorie plutôt que le teal uniforme,
 * repris du rendu fourni par la cliente (23/08).
 */
const CATEGORY_TINTS: Record<string, string> = {
  "manger-boire": "#f6d38f",
  "sortir-decouvrir": "#b9dcae",
  "faire-du-sport": "#a8cdec",
  "sante-bien-etre": "#cebbe9",
  "acheter-equiper": "#e8c298",
  "vie-pratique": "#bdc9cf",
  "famille-travail": "#f0b9c4",
  agenda: "#efb8d8",
};

/** Couleur pastel de fond pour le badge mascotte d'une catégorie (niveau 1). */
export function categoryTint(key: string): string {
  return CATEGORY_TINTS[key] ?? "var(--primary-tint)";
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
  period: CalendarBlank,
} as const;

export { MapPin, Clock, Phone, EnvelopeSimple, WhatsappLogo, Globe, NavigationArrow };
