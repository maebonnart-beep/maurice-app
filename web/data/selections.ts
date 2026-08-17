export type SelectionGroup = "besoins" | "envies" | "escapades";

/** Nom d'une icône Phosphor (@phosphor-icons/react), résolue dans DirectoryClient via SELECTION_ICONS. */
export type SelectionIconKey =
  | "CloudRain"
  | "Users"
  | "PiggyBank"
  | "Heart"
  | "Martini"
  | "MoonStars"
  | "SunHorizon"
  | "Lightning"
  | "ForkKnife"
  | "Basket"
  | "Camera"
  | "Waves"
  | "Leaf"
  | "Binoculars"
  | "Compass"
  | "Mountains"
  | "Wind"
  | "TreePalm"
  | "Sparkle";

export type Selection = {
  id: string;
  emoji: string;
  icon: SelectionIconKey;
  title: string;
  tagline: string;
  group: SelectionGroup;
  featured?: boolean;
  /** Photo libre de droits illustrant la sélection (thème, pas une fiche précise). */
  photoUrl: string;
  photoCredit: string;
  businessIds: string[];
};

export const SELECTION_GROUP_META: Record<SelectionGroup, { label: string; subtitle: string }> = {
  besoins: { label: "Les besoins", subtitle: "Ce que vous cherchez maintenant" },
  envies: { label: "Les envies", subtitle: "Ce dont vous avez envie" },
  escapades: { label: "Les escapades", subtitle: "Pour organiser une sortie" },
};

/**
 * Sélections éditoriales Koté Moris : 6-8 fiches choisies à la main par
 * thématique, chaque id renvoyant vers une fiche existante de businesses.json.
 * Une même fiche peut apparaître dans plusieurs sélections.
 */
export const SELECTIONS: Selection[] = [
  // --- Besoins ---
  {
    id: "quand-il-pleut",
    emoji: "🌧️",
    title: "Que faire quand il pleut ?",
    tagline: "Les meilleurs plans pour sauver une journée pluvieuse",
    group: "besoins",
    icon: "CloudRain",
    photoUrl: "https://images.pexels.com/photos/33115262/pexels-photo-33115262.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Павел Хлыстунов / Pexels",
    businessIds: [
      "aventure-du-sucre",
      "odysseo-oceanarium-mauritius-ltd",
      "blue-penny-museum",
      "mcine-trianon",
      "domaine-les-pailles",
      "bagatelle-mall-moka",
      "le-lucky-strike-bowling-lounge",
      "vanilla-village-2",
    ],
  },
  {
    id: "avec-les-enfants",
    emoji: "👧",
    title: "Avec les enfants",
    tagline: "Des endroits où les enfants vont vraiment s'éclater",
    group: "besoins",
    icon: "Users",
    photoUrl: "https://images.pexels.com/photos/28927726/pexels-photo-28927726.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Nastia Ligrain / Pexels",
    featured: true,
    businessIds: [
      "casela-nature-parks",
      "la-vanille-nature-park",
      "odysseo-oceanarium-mauritius-ltd",
      "ile-aux-aigrettes",
      "curious-mauritius",
      "chateau-de-labourdonnais",
      "vallee-de-ferney-sortir-decouvrir",
      "le-lucky-strike-bowling-lounge",
    ],
  },
  {
    id: "petit-budget",
    emoji: "💸",
    title: "Maurice sans exploser le budget",
    tagline: "Passer un bon moment sans se ruiner",
    group: "besoins",
    icon: "PiggyBank",
    photoUrl: "https://images.pexels.com/photos/9660/business-money-pink-coins.jpg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "ClickerHappy / Pexels",
    businessIds: [
      "coin-casse-croute",
      "chez-marilyn",
      "pyramid-briani-baguettes",
      "roti-baboolall-triolet",
      "tabagie-nationale",
      "plage-flic-en-flac",
      "port-louis-central-market",
      "marche-de-quatre-bornes",
    ],
  },
  {
    id: "pour-un-date",
    emoji: "💕",
    title: "Pour un date",
    tagline: "Restaurants et endroits romantiques",
    group: "besoins",
    icon: "Heart",
    photoUrl: "https://images.pexels.com/photos/7263555/pexels-photo-7263555.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Rachel Claire / Pexels",
    businessIds: [
      "lakaz-chamarel-view-bar",
      "chateau-mon-desir",
      "la-clef-des-champs",
      "le-pescatore",
      "la-potiniere",
      "bisou-rooftop-bar-restaurant-lux-grand-baie",
      "domaine-de-saint-aubin-souillac",
      "escale-creole-moka",
    ],
  },
  {
    id: "boire-un-verre",
    emoji: "🍹",
    title: "Où boire un verre ?",
    tagline: "Bars, rooftops, beach bars…",
    group: "besoins",
    icon: "Martini",
    photoUrl: "https://images.pexels.com/photos/29346150/pexels-photo-29346150.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Asad Photo Maldives / Pexels",
    businessIds: [
      "bisou-rooftop-bar-restaurant-lux-grand-baie",
      "rooftop-adults-only-restaurant-bar-lounge",
      "black-river-lounge-kitchen-tamarin",
      "c-beach-club-bel-ombre",
      "the-thirsty-fox-brewery",
      "cocochill-restaurant-bar-a-cocktails-swimming-pool",
      "buddha-bar-beach",
      "20vin-grand-baie-la-croisette",
    ],
  },
  {
    id: "que-faire-ce-soir",
    emoji: "🌙",
    title: "Que faire ce soir ?",
    tagline: "Cinéma, casino, bowling ou rooftop pour finir la journée",
    group: "besoins",
    icon: "MoonStars",
    photoUrl: "https://images.pexels.com/photos/11808313/pexels-photo-11808313.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Chris F / Pexels",
    businessIds: [
      "mcine-trianon",
      "grand-casino-caudan",
      "le-lucky-strike-bowling-lounge",
      "bisou-rooftop-bar-restaurant-lux-grand-baie",
      "strike-city-bagatelle",
      "cine-sous-les-etoiles",
      "dodo-quest-act",
      "shisha-flavours-lounge",
    ],
  },

  // --- Envies ---
  {
    id: "couchers-de-soleil",
    emoji: "🌅",
    title: "Les plus beaux couchers de soleil",
    tagline: "Nos spots préférés pour finir la journée en beauté",
    group: "envies",
    icon: "SunHorizon",
    photoUrl: "https://images.pexels.com/photos/7263551/pexels-photo-7263551.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Rachel Claire / Pexels",
    featured: true,
    businessIds: [
      "plage-le-morne",
      "plage-flic-en-flac",
      "lakaz-chamarel-view-bar",
      "heritage-sunset-cafe",
      "bois-cheri",
      "ravinala",
      "hibiscus-bar",
      "domaine-de-wolmar",
    ],
  },
  {
    id: "activites-decoiffantes",
    emoji: "🤩",
    title: "Les activités les plus décoiffantes",
    tagline: "Pour ceux qui veulent de l'adrénaline",
    group: "envies",
    icon: "Lightning",
    photoUrl: "https://images.pexels.com/photos/35412975/pexels-photo-35412975.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Margo Evardson / Pexels",
    businessIds: [
      "skydive-mauritius",
      "zip-line-adventure",
      "motrek-adventures-canyoning-mauritius",
      "quad-activities-mauritius",
      "kite-at-north",
      "abyss-centre-de-plongee",
      "corail-helicopteres",
      "vertical-world-ltd",
    ],
  },
  {
    id: "adresses-typiques",
    emoji: "🍛",
    title: "Les adresses les plus typiques",
    tagline: "Pour goûter au vrai Maurice",
    group: "envies",
    icon: "ForkKnife",
    photoUrl: "https://images.pexels.com/photos/674574/pexels-photo-674574.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Cats Coming / Pexels",
    featured: true,
    businessIds: [
      "chez-vassen-restaurant",
      "karay-mario-mahebourg",
      "chez-tante-athalie-pamplemousses",
      "roti-baboolall-triolet",
      "coin-casse-croute",
      "la-terrasse",
      "restaurant-coolen-chez-ram",
      "le-bazilic-mahebourg",
    ],
  },
  {
    id: "vrai-maurice",
    emoji: "🇲🇺",
    title: "Pour découvrir le vrai Maurice",
    tagline: "Marché, boutique, culture… des adresses très locales",
    group: "envies",
    icon: "Basket",
    photoUrl: "https://images.pexels.com/photos/1187299/pexels-photo-1187299.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Madison Inouye / Pexels",
    businessIds: [
      "port-louis-central-market",
      "marche-de-quatre-bornes",
      "aapravasi-ghat-port-louis",
      "chamarel-coffee-plantation-tour",
      "tabagie-nationale",
      "marche-poissons-plage-publique-grand-baie",
      "plantation-vanille-st-julien-hotman",
      "mahebourg-museum",
    ],
  },
  {
    id: "instagrammables",
    emoji: "📸",
    title: "Les endroits les plus Instagrammables",
    tagline: "Les spots qui valent le détour",
    group: "envies",
    icon: "Camera",
    photoUrl: "https://images.pexels.com/photos/29471844/pexels-photo-29471844.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Nursevim / Pexels",
    businessIds: [
      "chateau-de-labourdonnais",
      "plage-ile-aux-cerfs",
      "cascade-de-chamarel",
      "salines-de-yemen-tamarin",
      "ssr-botanical-garden-pamplemousses",
      "jardin-endemique-et-animalier-de-cap",
      "black-river-gorges-national-park",
      "notre-dame-auxiliatrice-de-cap-malheureux",
    ],
  },
  {
    id: "pieds-dans-le-sable",
    emoji: "🥥",
    title: "Les plus belles adresses les pieds dans le sable",
    tagline: "Manger ou boire face au lagon",
    group: "envies",
    icon: "Waves",
    photoUrl: "https://images.pexels.com/photos/315085/pexels-photo-315085.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Pexels",
    businessIds: [
      "les-canisses-resto-plage",
      "c-beach-club-bel-ombre",
      "buddha-bar-beach",
      "le-plage-restaurant-dinarobin-beachcomber",
      "moon-bar-k-floating-bar-dining-on-the-sea",
      "eden-beach-restaurant-lounge-bar",
      "the-boathouse-grill-le-morne",
      "blue-marlin-paradis-le-morne",
    ],
  },
  {
    id: "detente-nature",
    emoji: "🌿",
    title: "Détente & nature",
    tagline: "Pour couper complètement",
    group: "envies",
    icon: "Leaf",
    photoUrl: "https://images.pexels.com/photos/17005430/pexels-photo-17005430.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Alex Does Pictures / Pexels",
    businessIds: [
      "vanilla-village-2",
      "the-bay-club-at-anahita",
      "ebony-forest-chamarel",
      "black-river-gorges-national-park",
      "bel-ombre-nature-reserve",
      "ssr-botanical-garden-of-curepipe",
      "rivulet-terre-rouge-estuary-bird-sanctuary",
      "parc-national-de-bras-d-eau",
    ],
  },
  {
    id: "pepites-secretes",
    emoji: "💎",
    title: "Les pépites encore secrètes",
    tagline: "Les endroits moins connus des touristes",
    group: "envies",
    icon: "Binoculars",
    photoUrl: "https://images.pexels.com/photos/15256345/pexels-photo-15256345.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Kyle Karbowski / Pexels",
    businessIds: [
      "musee-de-la-petite-collection",
      "robert-edward-hart-memorial-museum",
      "galerie-francoise-vrot-chane-cane",
      "tabagie-nationale",
      "musee-du-coquillage",
      "sookdeo-bissoondoyal-memorial-museum",
      "frederick-hendrick-museum",
      "salines-de-yemen-tamarin",
    ],
  },

  // --- Escapades ---
  {
    id: "weekend-nord",
    emoji: "🧭",
    title: "Un weekend dans le Nord",
    tagline: "Notre sélection pour 2 jours",
    group: "escapades",
    icon: "Compass",
    photoUrl: "https://images.pexels.com/photos/33315208/pexels-photo-33315208.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "William ZALI / Pexels",
    businessIds: [
      "plage-mont-choisy",
      "chateau-de-labourdonnais",
      "aventure-du-sucre",
      "la-terrasse",
      "sunset-boulevard",
      "la-croisette",
      "plage-trou-aux-biches",
      "panorama-divers",
    ],
  },
  {
    id: "weekend-sud",
    emoji: "🏞️",
    title: "Un weekend dans le Sud",
    tagline: "Nature, paysages et découvertes",
    group: "escapades",
    icon: "Mountains",
    photoUrl: "https://images.pexels.com/photos/34671909/pexels-photo-34671909.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Adrien Olichon / Pexels",
    businessIds: [
      "plage-le-morne",
      "la-vanille-nature-park",
      "vallee-de-ferney-sortir-decouvrir",
      "cascade-de-chamarel",
      "ile-aux-aigrettes",
      "karay-mario-mahebourg",
      "domaine-de-saint-aubin-souillac",
      "musee-du-coquillage",
    ],
  },
  {
    id: "weekend-est",
    emoji: "🌊",
    title: "Un weekend dans l'Est",
    tagline: "Lagons, douceur et déconnexion",
    group: "escapades",
    icon: "Wind",
    photoUrl: "https://images.pexels.com/photos/30422272/pexels-photo-30422272.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "François Balédent / Pexels",
    businessIds: [
      "plage-ile-aux-cerfs",
      "plage-belle-mare",
      "parc-national-de-bras-d-eau",
      "belle-mare-ruins",
      "skydive-mauritius",
      "la-flibuste",
      "flacq-market",
      "otentic-eco-tent-experience",
    ],
  },
  {
    id: "weekend-ouest",
    emoji: "🌇",
    title: "Un weekend dans l'Ouest",
    tagline: "Soleil, mer et ambiance sunset",
    group: "escapades",
    icon: "SunHorizon",
    photoUrl: "https://images.pexels.com/photos/32041595/pexels-photo-32041595.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Alix Lee / Pexels",
    businessIds: [
      "plage-flic-en-flac",
      "casela-nature-parks",
      "black-river-gorges-national-park",
      "tamarin-sept-cascades-sortir-decouvrir",
      "cascavelle-mall",
      "krish-delights-local-streetfood-local-drinks",
      "domaine-de-wolmar",
      "abyss-centre-de-plongee",
    ],
  },
  {
    id: "journee-au-paradis",
    emoji: "🏝️",
    title: "Une journée au paradis",
    tagline: "Les plus belles plages, un déjeuner et un coucher de soleil",
    group: "escapades",
    icon: "TreePalm",
    photoUrl: "https://images.pexels.com/photos/37120933/pexels-photo-37120933.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Pornsiri Thetchutithamgull / Pexels",
    featured: true,
    businessIds: [
      "plage-ile-aux-cerfs",
      "plage-le-morne",
      "les-canisses-resto-plage",
      "c-beach-club-bel-ombre",
      "lakaz-chamarel-view-bar",
      "blue-marlin-paradis-le-morne",
      "ile-aux-aigrettes",
      "plage-blue-bay",
    ],
  },
  {
    id: "inviter-decouverte",
    emoji: "🍽️",
    title: "Inviter quelqu'un qui découvre Maurice",
    tagline: "Des lieux particulièrement représentatifs ou impressionnants",
    group: "escapades",
    icon: "Sparkle",
    photoUrl: "https://images.pexels.com/photos/3761182/pexels-photo-3761182.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoCredit: "Castorly Stock / Pexels",
    businessIds: [
      "chateau-de-labourdonnais",
      "le-pescatore",
      "aventure-du-sucre",
      "domaine-de-saint-aubin-souillac",
      "la-terrasse",
      "port-louis-central-market",
      "casela-nature-parks",
      "chateau-mon-desir",
    ],
  },
];
