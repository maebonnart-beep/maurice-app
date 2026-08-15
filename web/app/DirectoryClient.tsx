"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business, CategoryKey } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, FAMILIES, PRICE_RANGES } from "@/data/categories";
import type { Family, Subgroup } from "@/data/categories";
import { Logo } from "@/components/ui/Logo";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryRow } from "@/components/ui/CategoryRow";
import { UniversCard } from "@/components/ui/UniversCard";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { FilterDropdown, type DropdownOption } from "@/components/ui/FilterDropdown";
import { iconForKey, MapPin } from "@/lib/icons";
import { Heart, Star, ArrowLeft, House, Compass, UserCircle, Plus } from "@phosphor-icons/react";

// Attributs d'ambiance propres aux restaurants (facette « Ambiance »).
const RESTO_ATTRS = ["tables-exception", "plus-belles-vues", "frequente-locaux", "kids-friendly"];

// Badges → facette « Sélection » (coups de cœur & recommandations), toutes rubriques.
const BADGE_META: { key: string; label: string; emoji: string }[] = [
  { key: "coup-de-coeur", label: "Coup de cœur", emoji: "💛" },
  { key: "selection", label: "Sélection Koté Moris", emoji: "🏅" },
  { key: "partenaire", label: "Partenaire", emoji: "⭐" },
];

const UNCLASSIFIED = "__unclassified__";
const SIDEBAR_VISIBLE_RUBRIQUES = 5;

// Univers « lifestyle » de l'accueil (couche de présentation au-dessus des rubriques).
// Chaque univers = un regroupement de catégories entières et/ou de rubriques précises.
type UmbrellaGroup = { key: string; label: string; emoji: string; rubriques: string[] };
type Umbrella = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  categories?: CategoryKey[];
  rubriques?: string[];
  // Sous-rubriques optionnelles : l'univers se déroule d'abord par groupes.
  groups?: UmbrellaGroup[];
  // Univers réservé aux membres Premium (affiché à part, aperçu flouté + cadenas).
  premium?: boolean;
};

const LIFESTYLE: Umbrella[] = [
  {
    key: "manger",
    label: "Manger",
    emoji: "🍽️",
    color: "#e8703c",
    rubriques: [
      "restaurants", "tables-hotes", "chefs-domicile", "cours-de-cuisine",
      "grandes-surfaces", "epiceries-specialisees", "boucheries", "poissonneries",
      "fruits-et-legumes", "marches", "boulangeries", "produits-francais",
      "vins-spiritueux", "livraisons",
    ],
    groups: [
      {
        key: "manger-restauration",
        label: "Restauration",
        emoji: "🍽️",
        rubriques: ["restaurants", "tables-hotes", "chefs-domicile", "cours-de-cuisine"],
      },
      {
        key: "manger-commerces",
        label: "Commerces alimentaires",
        emoji: "🛒",
        rubriques: [
          "grandes-surfaces", "epiceries-specialisees", "boucheries", "poissonneries",
          "fruits-et-legumes", "marches", "boulangeries", "produits-francais",
          "vins-spiritueux", "livraisons",
        ],
      },
    ],
  },
  {
    key: "sortir",
    label: "Se divertir",
    emoji: "🍹",
    color: "#c9457a",
    rubriques: [
      "bars", "cafes-terrasses", "snacks-plage", "glaciers", "rhumeries",
      "cinemas", "bowling", "karting", "escape-game", "casinos",
      "culture-patrimoine", "bibliotheque-mediatheque",
    ],
    groups: [
      {
        key: "sortir-ambiance",
        label: "Bars & cafés",
        emoji: "🍹",
        rubriques: ["bars", "cafes-terrasses", "snacks-plage", "glaciers", "rhumeries"],
      },
      {
        key: "sortir-loisirs",
        label: "Loisirs",
        emoji: "🎳",
        rubriques: ["cinemas", "bowling", "karting", "escape-game", "casinos"],
      },
      {
        key: "sortir-culture",
        label: "Culture",
        emoji: "🏛️",
        rubriques: ["culture-patrimoine", "bibliotheque-mediatheque"],
      },
    ],
  },
  {
    key: "bouger",
    label: "Bouger & Nature",
    emoji: "🏝️",
    color: "#2e9e5b",
    rubriques: [
      "complexes-sportifs", "gym-fitness", "sports-nautiques", "golf", "tennis-padel",
      "centres-equestres", "randonnee-trail", "plages", "parcs-nationaux-cascades",
      "parcs-botaniques", "parcs-animaliers", "parcs-aventures", "excursions", "peche",
    ],
    groups: [
      {
        key: "bouger-sports",
        label: "Sports",
        emoji: "🏃",
        rubriques: [
          "complexes-sportifs", "gym-fitness", "sports-nautiques", "golf", "tennis-padel",
          "centres-equestres", "randonnee-trail",
        ],
      },
      {
        key: "bouger-nature",
        label: "Nature",
        emoji: "🌿",
        rubriques: [
          "plages", "parcs-nationaux-cascades", "parcs-botaniques",
          "parcs-animaliers", "parcs-aventures", "excursions", "peche",
        ],
      },
    ],
  },
  {
    key: "shopping",
    label: "Shopping",
    emoji: "🛍️",
    color: "#7c5cf0",
    rubriques: [
      "malls", "mode-adultes", "mode-enfants", "materiel-sports",
      "livres", "jeux", "souvenirs", "equipement-maison", "beaute", "electromenager",
      "high-tech",
    ],
  },
  {
    key: "sante-bien-etre",
    label: "Santé & Bien-être",
    emoji: "💆",
    color: "#0ea5a0",
    rubriques: [
      "cliniques-privees", "centres-sante-publics", "medecins", "dentistes", "opticiens",
      "laboratoires", "pharmacies", "veterinaires", "spa-instituts", "coiffeurs",
      "onglerie-manucure", "barbiers", "tatouage-piercing", "yoga-pilates",
      "medecine-douce", "sports-bien-etre",
    ],
    groups: [
      {
        key: "sbe-sante",
        label: "Santé",
        emoji: "🩺",
        rubriques: [
          "cliniques-privees", "centres-sante-publics", "medecins", "dentistes",
          "opticiens", "laboratoires", "pharmacies", "veterinaires",
        ],
      },
      {
        key: "sbe-soins",
        label: "Soins & bien-être",
        emoji: "💆",
        rubriques: [
          "spa-instituts", "coiffeurs", "onglerie-manucure", "barbiers",
          "tatouage-piercing", "yoga-pilates", "medecine-douce", "sports-bien-etre",
        ],
      },
    ],
  },
  {
    key: "pratique",
    label: "Vie pratique",
    emoji: "🧰",
    color: "#4a6572",
    rubriques: [
      "poste", "postes-police", "banques", "distributeurs", "assurances", "notaires",
      "avocats", "comptables", "ambassades-consulats", "expatriation-visas", "photographes",
      "telecom", "plateformes-multiservices", "garages-mecaniciens", "concessionnaires",
      "controle-technique", "location-voiture", "taxis-transferts", "vtc-apps", "depannages",
      "informatique-reparation", "pressing-blanchisserie", "agences", "coworking",
      "cafe-coworking", "garde-enfants", "networking", "business",
      "activites-enfants-famille", "centres-loisirs-animations-enfants",
      "ecoles-privees-internationales", "creches-garderies", "famille",
    ],
    groups: [
      {
        key: "pratique-demarches",
        label: "Démarches & admin",
        emoji: "🏛️",
        rubriques: [
          "poste", "postes-police", "banques", "distributeurs", "assurances", "notaires",
          "avocats", "comptables", "ambassades-consulats", "expatriation-visas",
          "photographes", "telecom", "plateformes-multiservices",
        ],
      },
      {
        key: "pratique-auto-maison",
        label: "Auto & maison",
        emoji: "🔧",
        rubriques: [
          "garages-mecaniciens", "concessionnaires", "controle-technique",
          "location-voiture", "taxis-transferts", "vtc-apps", "depannages",
          "informatique-reparation", "pressing-blanchisserie",
        ],
      },
      {
        key: "pratique-immo-pro",
        label: "Immobilier & pro",
        emoji: "🏢",
        rubriques: ["agences", "coworking", "cafe-coworking", "networking", "garde-enfants", "business"],
      },
      {
        key: "pratique-famille",
        label: "Famille & Éducation",
        emoji: "👨‍👩‍👧",
        rubriques: [
          "activites-enfants-famille", "centres-loisirs-animations-enfants",
          "ecoles-privees-internationales", "creches-garderies", "famille",
        ],
      },
    ],
  },
  // ── Univers réservés aux membres Premium ──────────────────────────────
  {
    key: "evenements",
    label: "Événements",
    emoji: "🎉",
    color: "#e0518a",
    categories: ["evenements"],
    premium: true,
  },
  {
    key: "seconde-main",
    label: "Seconde main",
    emoji: "♻️",
    color: "#2e8b57",
    categories: ["seconde-main"],
    premium: true,
  },
];

// Clés d'univers réservés aux membres Premium (aperçu flouté + cadenas).
const PREMIUM_KEYS = new Set(LIFESTYLE.filter((u) => u.premium).map((u) => u.key));

// Accès rapide à un univers par sa clé (menu illustré « Par catégorie »).
const UMBRELLA_BY_KEY: Record<string, (typeof LIFESTYLE)[number]> = Object.fromEntries(
  LIFESTYLE.map((u) => [u.key, u]),
);

// Regroupement des 8 univers en 4 grandes cartes d'accueil (2 par ligne) :
// chaque carte mène à un choix parmi ses univers d'origine, qui reprennent
// ensuite la navigation habituelle (groupes → rubriques → résultats).
const MERGED_GROUPS: { key: string; label: string; photoKey: string; subtitle: string; children: string[] }[] = [
  {
    key: "manger-sortir",
    label: "Manger & Sortir",
    photoKey: "manger",
    subtitle: "Restaurants, commerces, sorties & événements",
    children: ["manger", "sortir", "evenements"],
  },
  {
    key: "bouger-explorer",
    label: "Bouger & Explorer",
    photoKey: "bouger",
    subtitle: "Sports, randonnées, plages & parcs",
    children: ["bouger"],
  },
  {
    key: "shopping-secondemain",
    label: "Shopping & Seconde main",
    photoKey: "shopping",
    subtitle: "Mode, équipement, bonnes affaires & occasions",
    children: ["shopping", "seconde-main"],
  },
  {
    key: "sante-pratique",
    label: "Santé & Vie pratique",
    photoKey: "sante-bien-etre",
    subtitle: "Médecins, bien-être, services & démarches",
    children: ["sante-bien-etre", "pratique"],
  },
];
const MERGED_GROUP_BY_KEY: Record<string, (typeof MERGED_GROUPS)[number]> = Object.fromEntries(
  MERGED_GROUPS.map((g) => [g.key, g]),
);

// Zones cliquables du menu illustré (/menu-univers.png) : centre + rayon en % de
// l'image, calés sur chaque badge tenu par le poulpe.
const UNIVERS_HOTSPOTS: { key: string; cx: number; cy: number; r: number }[] = [
  { key: "manger", cx: 27, cy: 12, r: 12 },
  { key: "sortir", cx: 73, cy: 13, r: 12 },
  { key: "bouger", cx: 14, cy: 38, r: 12 },
  { key: "shopping", cx: 87, cy: 39, r: 12 },
  { key: "sante-bien-etre", cx: 22, cy: 64, r: 12 },
  { key: "pratique", cx: 79, cy: 65, r: 12 },
  { key: "evenements", cx: 35, cy: 83, r: 12 },
  { key: "seconde-main", cx: 66, cy: 84, r: 12 },
];

// Tuile d'entrée du menu d'accueil : image + titre + sous-titre.
function HomeEntry({
  img,
  title,
  subtitle,
  onClick,
}: {
  img: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-4 h-full rounded-tile border border-border text-center shadow-sm active:scale-[.98] transition-transform"
      style={{ background: "var(--surface-2, #ececef)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="" aria-hidden className="h-[24vh] max-h-[210px] min-h-[100px] w-auto max-w-full object-contain" />
      <span className="text-[18px] font-semibold leading-tight text-ink">{title}</span>
      <span className="text-[13px] text-muted leading-tight">{subtitle}</span>
    </button>
  );
}

// Métadonnées de rubrique (emoji/libellé) par clé, tous univers confondus.
const RUBRIQUE_MAP: Record<string, { key: string; label: string; emoji: string }> = Object.fromEntries(
  Object.values(SUBCATEGORIES)
    .flat()
    .map((s) => [s.key, s])
);

// Clés de rubriques couvertes par un univers (catégories entières + rubriques explicites).
function resolveRubriques(u: Umbrella): string[] {
  const set = new Set<string>();
  u.categories?.forEach((cat) => (SUBCATEGORIES[cat] ?? []).forEach((s) => set.add(s.key)));
  u.rubriques?.forEach((r) => set.add(r));
  return [...set];
}

// Familles par clé + sous-groupes par rubrique parente (pour la navigation à niveaux).
const FAMILY_BY_KEY: Record<string, { category: CategoryKey; family: Family }> = {};
(Object.keys(FAMILIES) as CategoryKey[]).forEach((cat) => {
  FAMILIES[cat]?.forEach((f) => {
    FAMILY_BY_KEY[f.key] = { category: cat, family: f };
  });
});
const SUBGROUP_BY_PARENT: Record<string, Subgroup> = {};
Object.values(FAMILIES).forEach((fams) =>
  fams?.forEach((f) => f.subgroups?.forEach((sg) => (SUBGROUP_BY_PARENT[sg.parent] = sg)))
);

// Sous-rubriques d'univers (ex. Bouger → Nature / Sports) par clé de groupe.
const GROUP_BY_KEY: Record<string, UmbrellaGroup> = {};
LIFESTYLE.forEach((u) => u.groups?.forEach((g) => (GROUP_BY_KEY[g.key] = g)));

// Un univers « pur » (une seule catégorie, sans rubriques explicites) ayant des familles
// se déroule d'abord par familles (ex. Manger → Restauration / Commerces).
function umbrellaFamilies(u: Umbrella): Family[] | null {
  if (u.categories?.length === 1 && !u.rubriques) {
    const fams = FAMILIES[u.categories[0]];
    if (fams && fams.length) return fams;
  }
  return null;
}

// Un niveau de navigation en tuiles.
type NavNode = { kind: "merged" | "umbrella" | "group" | "family" | "subgroup"; key: string; label: string; emoji: string };

const ZONES: { key: string; label: string; emoji: string }[] = [
  { key: "nord", label: "Nord", emoji: "⬆️" },
  { key: "est", label: "Est", emoji: "➡️" },
  { key: "sud", label: "Sud", emoji: "⬇️" },
  { key: "ouest", label: "Ouest", emoji: "⬅️" },
  { key: "centre", label: "Centre", emoji: "🎯" },
];

// Distance à vol d'oiseau (km) entre deux points GPS — pour « Autour de moi ».
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-muted">
      Chargement de la carte…
    </div>
  ),
});

export default function DirectoryClient({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const zonePickerRef = useRef<HTMLDivElement>(null);
  // Facettes de rubrique (type / prix / ambiance) — multi-sélection.
  const [facetTypes, setFacetTypes] = useState<Set<string>>(new Set());
  const [facetPrices, setFacetPrices] = useState<Set<string>>(new Set());
  const [facetAttrs, setFacetAttrs] = useState<Set<string>>(new Set());
  const [facetBadges, setFacetBadges] = useState<Set<string>>(new Set());
  const [expandedInSidebar, setExpandedInSidebar] = useState<Set<string>>(new Set());
  const [resultsView, setResultsView] = useState<"liste" | "carte">("liste");
  // « Autour de moi » : tri par distance depuis la position de l'utilisateur.
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "unavailable" | "ok">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Mobile : forcer la liste à plat malgré l'écran d'accueil par catégories.
  const [browseAll, setBrowseAll] = useState(false);
  // Accueil « Option A » : menu d'entrée → puis mode choisi.
  const [homeMode, setHomeMode] = useState<
    "menu" | "categories" | "favoris" | "listes" | "profil" | "ajouter"
  >("menu");
  // Navigation en tuiles à niveaux : pile de nœuds (univers → familles → rubriques →
  // sous-groupes). Vide = grille des univers (accueil).
  const [navStack, setNavStack] = useState<NavNode[]>([]);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const onBoundsChange = useCallback((b: MapBounds) => setMapBounds(b), []);

  const subcategories = SUBCATEGORIES[active as keyof typeof SUBCATEGORIES];
  const families = FAMILIES[active as keyof typeof FAMILIES];
  const familyChildKeys = useMemo(
    () =>
      new Set(
        families?.flatMap((f) => [
          ...f.children,
          ...(f.subgroups?.flatMap((sg) => sg.children) ?? []),
        ]) ?? []
      ),
    [families]
  );
  const ungroupedSubcategories = subcategories?.filter((s) => !familyChildKeys.has(s.key)) ?? [];

  function resetRestoFacets() {
    setFacetTypes(new Set());
    setFacetPrices(new Set());
    setFacetAttrs(new Set());
    setFacetBadges(new Set());
  }

  // Bascule une valeur dans un Set d'état (multi-sélection).
  function toggleInSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Retour à l'écran d'accueil : réinitialise tous les filtres.
  function goHome() {
    setActive("all");
    setActiveThemes(new Set());
    setActiveZone(null);
    setQuery("");
    setBrowseAll(false);
    setNavStack([]);
    setHomeMode("menu");
    resetRestoFacets();
    setNearMe(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Entrée « Recherche » du menu d'accueil : focalise le champ de recherche du bandeau.
  function focusSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    (document.querySelector('header input[type="search"]') as HTMLInputElement | null)?.focus();
  }

  // Descendre d'un niveau dans la navigation en tuiles.
  function pushNav(node: NavNode) {
    setNavStack((prev) => [...prev, node]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectCategory(key: string) {
    setActive(key);
    setActiveThemes(new Set());
    setBrowseAll(false);
    setNavStack([]);
  }

  function toggleZone(key: string) {
    setActiveZone((prev) => (prev === key ? null : key));
  }

  // Ferme le picker de zone (bandeau du bas) au clic extérieur / Échap.
  useEffect(() => {
    if (!zonePickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (zonePickerRef.current && !zonePickerRef.current.contains(e.target as Node)) setZonePickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZonePickerOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [zonePickerOpen]);

  function toggleTheme(key: string) {
    setActiveThemes((prev) => (prev.has(key) ? new Set() : new Set([key])));
    resetRestoFacets(); // les facettes ne valent que pour la vue restaurants courante
    // On conserve la pile de navigation en tuiles : le bouton « Retour » de la
    // page de résultats ramène ainsi à la grille de tuiles du bon niveau.
  }

  // Bouton « Retour » unifié : revient d'un cran (résultats → tuiles →
  // sous-menu d'accueil → menu) au lieu de tout réinitialiser. Utilisé par
  // les bandeaux sticky de la navigation en tuiles et de la liste de résultats.
  const canGoBack =
    navStack.length > 0 || activeThemes.size > 0 || browseAll || active !== "all" || homeMode !== "menu";
  function goBackFromResults() {
    if (activeThemes.size > 0) {
      setActiveThemes(new Set()); // retour aux tuiles du niveau courant
      return;
    }
    if (navStack.length > 0) {
      setNavStack((prev) => prev.slice(0, -1)); // remonte d'un cran dans les tuiles
      return;
    }
    if (browseAll) {
      setBrowseAll(false);
      return;
    }
    if (active !== "all") {
      setActive("all");
      return;
    }
    if (homeMode !== "menu") {
      setHomeMode("menu");
      return;
    }
    goHome();
  }

  function toggleSidebarExpand(catKey: string) {
    setExpandedInSidebar((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      c[b.category] = (c[b.category] || 0) + 1;
    });
    return c;
  }, [businesses]);

  const themeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!subcategories) return c;
    businesses.forEach((b) => {
      if (active !== "all" && b.category !== active) return;
      if (!b.themes || b.themes.length === 0) {
        c[UNCLASSIFIED] = (c[UNCLASSIFIED] || 0) + 1;
        return;
      }
      b.themes.forEach((t) => {
        c[t] = (c[t] || 0) + 1;
      });
    });
    return c;
  }, [businesses, active, subcategories]);

  const zoneCounts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (active !== "all" && b.category !== active) return;
      if (b.zone) c[b.zone] = (c[b.zone] || 0) + 1;
    });
    return c;
  }, [businesses, active]);

  // Rubrique active (une seule) → facettes : Type (sous-groupe), Prix, Ambiance (restos).
  const activeRubrique =
    activeThemes.size === 1 && !activeThemes.has(UNCLASSIFIED) ? [...activeThemes][0] : null;
  const activeSubgroup = activeRubrique ? SUBGROUP_BY_PARENT[activeRubrique] : undefined;
  const isRestoView = activeRubrique === "restaurants";

  // « Ménage » des fiches : on masque les tags déjà impliqués par le contexte de
  // navigation/filtre actif (rubriques + facettes sélectionnées). Le badge de
  // catégorie a été retiré des fiches (redondant avec la navigation par univers).
  const ficheHiddenKeys = useMemo(() => {
    const s = new Set<string>();
    activeThemes.forEach((k) => { if (k !== UNCLASSIFIED) s.add(k); });
    facetTypes.forEach((k) => s.add(k));
    facetAttrs.forEach((k) => s.add(k));
    facetPrices.forEach((k) => s.add(k));
    return s;
  }, [activeThemes, facetTypes, facetAttrs, facetPrices]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses
      .filter((b) => {
        if (activeZone && b.zone !== activeZone) return false;
        if (active !== "all" && b.category !== active) return false;
        if (activeThemes.size > 0) {
          const themes = b.themes || [];
          const matches =
            (activeThemes.has(UNCLASSIFIED) && themes.length === 0) ||
            themes.some((t) => activeThemes.has(t));
          if (!matches) return false;
        }
        // Facettes de rubrique : type (OU), prix (OU), sélection (OU), ambiance (ET, restos).
        if (activeRubrique) {
          const themes = b.themes || [];
          if (facetTypes.size > 0 && !themes.some((t) => facetTypes.has(t))) return false;
          if (facetPrices.size > 0 && !(b.priceRange && facetPrices.has(b.priceRange))) return false;
          if (facetBadges.size > 0 && !(b.badge && facetBadges.has(b.badge))) return false;
          if (isRestoView && facetAttrs.size > 0 && ![...facetAttrs].every((a) => themes.includes(a))) return false;
        }
        if (!q) return true;
        return (b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label)
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0));
  }, [businesses, query, active, activeThemes, activeZone, activeRubrique, isRestoView, facetTypes, facetPrices, facetBadges, facetAttrs]);

  // Base rubrique (rubrique + zone + recherche, hors facettes) pour les compteurs.
  const facetCounts = useMemo(() => {
    const type: Record<string, number> = {};
    const price: Record<string, number> = {};
    const attr: Record<string, number> = {};
    const badge: Record<string, number> = {};
    if (!activeRubrique) return { type, price, attr, badge, total: 0 };
    const typeChildren = new Set(activeSubgroup?.children ?? []);
    const q = query.trim().toLowerCase();
    let total = 0;
    businesses.forEach((b) => {
      if (!(b.themes || []).includes(activeRubrique)) return;
      if (activeZone && b.zone !== activeZone) return;
      if (q && !(b.name + " " + b.address).toLowerCase().includes(q)) return;
      total++;
      (b.themes || []).forEach((t) => {
        if (typeChildren.has(t)) type[t] = (type[t] || 0) + 1;
        if (isRestoView && RESTO_ATTRS.includes(t)) attr[t] = (attr[t] || 0) + 1;
      });
      if (b.priceRange) price[b.priceRange] = (price[b.priceRange] || 0) + 1;
      if (b.badge) badge[b.badge] = (badge[b.badge] || 0) + 1;
    });
    return { type, price, attr, badge, total };
  }, [businesses, activeRubrique, activeSubgroup, isRestoView, activeZone, query]);

  const facetActive = facetTypes.size + facetPrices.size + facetBadges.size + facetAttrs.size > 0;

  // Cartes affichées : limitées à la zone visible de la carte si le filtre est actif.
  const boundedRows = useMemo(() => {
    if (!filterByMap || !mapBounds) return rows;
    return rows.filter(
      (b) =>
        b.lat === undefined ||
        b.lng === undefined ||
        (b.lat <= mapBounds.north &&
          b.lat >= mapBounds.south &&
          b.lng <= mapBounds.east &&
          b.lng >= mapBounds.west)
    );
  }, [rows, filterByMap, mapBounds]);

  // « Autour de moi » : distance par fiche + tri du plus proche au plus loin.
  const distanceById = useMemo(() => {
    const m: Record<string, number> = {};
    if (!nearMe || !userPos) return m;
    boundedRows.forEach((b) => {
      if (Number.isFinite(b.lat) && Number.isFinite(b.lng)) {
        m[b.id] = haversineKm(userPos.lat, userPos.lng, b.lat as number, b.lng as number);
      }
    });
    return m;
  }, [boundedRows, nearMe, userPos]);

  const visibleRows = useMemo(() => {
    if (!nearMe || !userPos) return boundedRows;
    return [...boundedRows].sort((a, b) => {
      const da = distanceById[a.id] ?? Infinity;
      const db = distanceById[b.id] ?? Infinity;
      return da - db;
    });
  }, [boundedRows, nearMe, userPos, distanceById]);

  // Active « Autour de moi » : demande la position (une fois), puis trie par distance.
  function toggleNearMe() {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (userPos) {
      setNearMe(true);
      setResultsView("liste");
      if (showHome) setBrowseAll(true);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
        setNearMe(true);
        setResultsView("liste");
        if (showHome) setBrowseAll(true);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function selectFromMap(id: string) {
    setSelectedId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function selectFromCard(id: string) {
    setOpenId(id); // ouvre la vue détail plein écran (sans déplacer la carte)
  }

  const openBusiness = openId ? businesses.find((b) => b.id === openId) ?? null : null;

  function clearThemeFilter(key: string) {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  const activeThemeLabel = useMemo(() => {
    if (activeThemes.size === 0) return null;
    const key = [...activeThemes][0];
    if (key === UNCLASSIFIED) return { key, emoji: "❔", label: "Non classé" };
    // Rubrique de la catégorie active, sinon repli global (filtres inter-catégories).
    const theme = subcategories?.find((s) => s.key === key) ?? RUBRIQUE_MAP[key];
    return theme ? { key: theme.key, emoji: theme.emoji, label: theme.label } : null;
  }, [activeThemes, subcategories]);

  // Comptes globaux par rubrique (toutes catégories, tenant compte de la zone).
  const themeCountsAll = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (activeZone && b.zone !== activeZone) return;
      (b.themes ?? []).forEach((t) => {
        c[t] = (c[t] || 0) + 1;
      });
    });
    return c;
  }, [businesses, activeZone]);

  // Nombre de fiches (distinctes) par univers lifestyle, tenant compte de la zone.
  const umbrellaCounts = useMemo(() => {
    const sets = LIFESTYLE.map((u) => ({ key: u.key, keys: new Set(resolveRubriques(u)) }));
    const counts: Record<string, number> = {};
    businesses.forEach((b) => {
      if (activeZone && b.zone !== activeZone) return;
      const themes = b.themes ?? [];
      sets.forEach(({ key, keys }) => {
        if (themes.some((t) => keys.has(t))) counts[key] = (counts[key] || 0) + 1;
      });
    });
    return counts;
  }, [businesses, activeZone]);

  // Écran d'accueil : univers lifestyle plutôt que 2574 résultats en vrac.
  const showHome =
    active === "all" && activeThemes.size === 0 && query.trim() === "" && !browseAll;

  // On montre des tuiles (univers / niveaux) plutôt que la liste.
  const mobileTiles = showHome;

  // Recherche masquée sur tout l'accueil (menu, catégories, navigation en
  // tuiles) pour gagner de la place ; elle réapparaît une fois sur des
  // résultats concrets (liste/carte), où affiner par mot-clé est utile.
  const showHeaderSearch = !showHome;

  // Rubriques les plus fournies toutes catégories confondues, pour la section
  // « Sous-catégories populaires » de l'accueil.
  const topRubriques = useMemo(() => {
    return Object.entries(themeCountsAll)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, count]) => {
        const r = RUBRIQUE_MAP[key];
        return r ? { key: r.key, label: r.label, emoji: r.emoji, count } : null;
      })
      .filter((t): t is { key: string; label: string; emoji: string; count: number } => t !== null);
  }, [themeCountsAll]);

  // Compte distinct de fiches ayant l'une des rubriques données (tenant compte de la zone).
  const countThemes = (keys: string[]) => {
    const set = new Set(keys);
    let n = 0;
    businesses.forEach((b) => {
      if (activeZone && b.zone !== activeZone) return;
      if ((b.themes ?? []).some((t) => set.has(t))) n++;
    });
    return n;
  };

  type TileDesc = { key: string; label: string; emoji: string; count: number; drillTo?: NavNode; themeKey?: string };

  // Une rubrique → tuile qui descend dans son sous-groupe (ex. cuisines) si elle en a un,
  // sinon tuile terminale qui filtre la liste.
  function rubriqueTile(rk: string): TileDesc | null {
    const r = RUBRIQUE_MAP[rk];
    if (!r) return null;
    const count = themeCountsAll[r.key] || 0;
    if (count === 0) return null;
    // Toute rubrique ouvre directement la liste filtrable : ses sous-types
    // (cuisines, disciplines, types de shopping…) sont proposés en facettes
    // plutôt qu'en tuiles à dérouler.
    return { key: r.key, label: r.label, emoji: r.emoji, count, themeKey: r.key };
  }

  // Tuiles du niveau courant de la pile de navigation.
  function levelTiles(stack: NavNode[]): TileDesc[] {
    const top = stack[stack.length - 1];
    if (!top) return [];
    if (top.kind === "merged") {
      const g = MERGED_GROUP_BY_KEY[top.key];
      if (!g) return [];
      return g.children
        .map((ck): TileDesc | null => {
          const u = UMBRELLA_BY_KEY[ck];
          if (!u) return null;
          const count = umbrellaCounts[ck] || 0;
          return count > 0
            ? { key: u.key, label: u.label, emoji: u.emoji, count, drillTo: { kind: "umbrella", key: u.key, label: u.label, emoji: u.emoji } }
            : null;
        })
        .filter((t): t is TileDesc => t !== null);
    }
    if (top.kind === "umbrella") {
      const u = LIFESTYLE.find((x) => x.key === top.key);
      if (!u) return [];
      // Sous-rubriques d'univers (ex. Bouger → Nature / Sports).
      if (u.groups) {
        return u.groups
          .map((g): TileDesc | null => {
            const count = countThemes(g.rubriques);
            return count > 0
              ? { key: g.key, label: g.label, emoji: g.emoji, count, drillTo: { kind: "group", key: g.key, label: g.label, emoji: g.emoji } }
              : null;
          })
          .filter((t): t is TileDesc => t !== null);
      }
      const fams = umbrellaFamilies(u);
      if (fams) {
        return fams
          .map((f): TileDesc | null => {
            const count = countThemes(f.children);
            return count > 0
              ? { key: f.key, label: f.label, emoji: f.emoji, count, drillTo: { kind: "family", key: f.key, label: f.label, emoji: f.emoji } }
              : null;
          })
          .filter((t): t is TileDesc => t !== null);
      }
      return resolveRubriques(u)
        .map(rubriqueTile)
        .filter((t): t is TileDesc => t !== null)
        .sort((a, b) => b.count - a.count);
    }
    if (top.kind === "group") {
      const g = GROUP_BY_KEY[top.key];
      if (!g) return [];
      return g.rubriques
        .map(rubriqueTile)
        .filter((t): t is TileDesc => t !== null)
        .sort((a, b) => b.count - a.count);
    }
    if (top.kind === "family") {
      const entry = FAMILY_BY_KEY[top.key];
      if (!entry) return [];
      return entry.family.children
        .map(rubriqueTile)
        .filter((t): t is TileDesc => t !== null)
        .sort((a, b) => b.count - a.count);
    }
    // sous-groupe : « Tout {rubrique} » + les spécialités
    const sg = SUBGROUP_BY_PARENT[top.key];
    if (!sg) return [];
    const tiles: TileDesc[] = [
      { key: "__all__" + top.key, label: `Tout ${top.label.toLowerCase()}`, emoji: "📋", count: themeCountsAll[top.key] || 0, themeKey: top.key },
    ];
    sg.children.forEach((ck) => {
      const t = rubriqueTile(ck);
      if (t) tiles.push(t);
    });
    return tiles;
  }

  function onTileClick(t: TileDesc) {
    if (t.drillTo) pushNav(t.drillTo);
    else if (t.themeKey) toggleTheme(t.themeKey);
  }

  const breadcrumb =
    activeThemeLabel ??
    (active !== "all"
      ? { key: active, emoji: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].emoji, label: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].label }
      : { key: "all", emoji: "✨", label: "Tout" });

  function renderSidebarTree(catKey: string) {
    const catsOrUndefined = SUBCATEGORIES[catKey as keyof typeof SUBCATEGORIES];
    const fams = FAMILIES[catKey as keyof typeof FAMILIES];
    if (!catsOrUndefined) return null;
    const cats = catsOrUndefined;
    const famChildKeys = new Set(
      fams?.flatMap((f) => [...f.children, ...(f.subgroups?.flatMap((sg) => sg.children) ?? [])]) ?? []
    );
    const ungrouped = cats.filter((s) => !famChildKeys.has(s.key));

    function rubriqueRow(t: { key: string; label: string; emoji: string }) {
      const isSelected = activeThemes.has(t.key);
      return (
        <div key={t.key}>
          <button
            onClick={() => toggleTheme(t.key)}
            aria-pressed={isSelected}
            className={`w-full flex items-center justify-between gap-2 pl-6 pr-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
              isSelected ? "bg-primary-tint text-primary-deep font-semibold" : "text-ink hover:bg-surface-2"
            }`}
          >
            <span className="truncate">
              {t.emoji} {t.label}
            </span>
            <span className="text-[11px] font-bold opacity-60 shrink-0">{themeCounts[t.key] || 0}</span>
          </button>
          {isSelected &&
            fams
              ?.flatMap((f) => f.subgroups ?? [])
              .filter((sg) => sg.parent === t.key)
              .map((sg) => (
                <div key={sg.key} className="pl-3 border-l border-dashed border-border ml-6 mt-0.5 mb-1">
                  {sg.children.map((childKey) => {
                    const child = cats.find((s) => s.key === childKey);
                    if (!child) return null;
                    const childSelected = activeThemes.has(child.key);
                    return (
                      <button
                        key={child.key}
                        onClick={() => toggleTheme(child.key)}
                        aria-pressed={childSelected}
                        className={`w-full flex items-center justify-between gap-2 pl-3 pr-2 py-1 rounded-lg text-[12.5px] text-left transition-colors ${
                          childSelected ? "bg-primary-tint text-primary-deep font-semibold" : "text-muted hover:bg-surface-2 hover:text-ink"
                        }`}
                      >
                        <span className="truncate">
                          {child.emoji} {child.label}
                        </span>
                        <span className="text-[10.5px] font-bold opacity-60 shrink-0">
                          {themeCounts[child.key] || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
        </div>
      );
    }

    const allEntries: { key: string; header?: string; row: { key: string; label: string; emoji: string } }[] = [];
    function pushFamily(f: NonNullable<typeof fams>[number]) {
      f.children.forEach((childKey) => {
        const child = cats.find((s) => s.key === childKey);
        if (child) allEntries.push({ key: child.key, header: f.label, row: child });
      });
    }
    fams?.filter((f) => f.position !== "end").forEach(pushFamily);
    ungrouped.forEach((t) => allEntries.push({ key: t.key, row: t }));
    fams?.filter((f) => f.position === "end").forEach(pushFamily);

    const expanded = expandedInSidebar.has(catKey);
    const visibleEntries = expanded ? allEntries : allEntries.slice(0, SIDEBAR_VISIBLE_RUBRIQUES);
    const hiddenCount = allEntries.length - visibleEntries.length;

    let lastHeader: string | undefined;
    return (
      <div className="pb-1.5">
        {visibleEntries.map((entry) => {
          const showHeader = entry.header && entry.header !== lastHeader;
          lastHeader = entry.header;
          return (
            <div key={entry.key}>
              {showHeader && (
                <div className="pl-6 pt-2 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-muted/80">
                  {entry.header}
                </div>
              )}
              {rubriqueRow(entry.row)}
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <button
            onClick={() => toggleSidebarExpand(catKey)}
            className="w-full text-left pl-6 pr-2 py-1.5 text-[12.5px] font-semibold text-primary-deep hover:underline"
          >
            + {hiddenCount} autres rubriques
          </button>
        )}
        {expanded && allEntries.length > SIDEBAR_VISIBLE_RUBRIQUES && (
          <button
            onClick={() => toggleSidebarExpand(catKey)}
            className="w-full text-left pl-6 pr-2 py-1 text-[12px] text-muted hover:underline"
          >
            Réduire
          </button>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Zone : colonne verticale (activable dans la sidebar / le tiroir) */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted/80 mb-1.5 px-1">
          📍 Zone
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setActiveZone(null)}
            aria-pressed={activeZone === null}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-left transition-colors ${
              activeZone === null ? "bg-primary text-white" : "text-ink hover:bg-surface-2"
            }`}
          >
            <span>📍 Toute l&apos;île</span>
          </button>
          {ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => toggleZone(z.key)}
              aria-pressed={activeZone === z.key}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-left transition-colors ${
                activeZone === z.key ? "bg-primary text-white" : "text-ink hover:bg-surface-2"
              }`}
            >
              <span>
                {z.emoji} {z.label}
              </span>
              <span className="text-[11px] font-bold opacity-70">{zoneCounts[z.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>
      {activeThemeLabel && (
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-3 py-2.5 mb-1.5">
          <div className="flex items-center justify-between gap-2 bg-primary-tint text-primary-deep rounded-lg px-2.5 py-1.5">
            <span className="text-[12.5px] font-semibold truncate">
              {activeThemeLabel.emoji} {activeThemeLabel.label}
            </span>
            <button
              onClick={() => clearThemeFilter(activeThemeLabel.key)}
              aria-label="Retirer ce filtre"
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-primary-deep hover:bg-white/60 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="px-2 pb-4">
        <button
          onClick={() => selectCategory("all")}
          aria-pressed={active === "all"}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
            active === "all" ? "bg-primary text-white" : "text-ink hover:bg-surface-2"
          }`}
        >
          <span>🎯 Tout</span>
          <span className="text-[12px] font-bold opacity-75">{businesses.length}</span>
        </button>
        {CATEGORIES.map((c) => {
          const isOpen = active === c.key;
          const isEmpty = (counts[c.key] || 0) === 0;
          return (
            <div key={c.key} className="mt-0.5">
              <button
                onClick={() => !isEmpty && selectCategory(c.key)}
                aria-pressed={isOpen}
                disabled={isEmpty}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
                  isOpen
                    ? "bg-primary text-white"
                    : isEmpty
                    ? "text-muted/50 cursor-default"
                    : "text-ink hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isOpen ? "#fff" : c.color }}
                  />
                  <span className="truncate">{c.label}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[12px] font-bold opacity-75">{counts[c.key] || 0}</span>
                  {!isEmpty && (
                    <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  )}
                </span>
              </button>
              {isOpen && renderSidebarTree(c.key)}
            </div>
          );
        })}
      </div>
      <p className="px-4 pb-4 text-[11.5px] leading-[1.5] text-muted border-t border-border pt-3">
        1 seul niveau de clic pour tout voir — plus de double scroll horizontal.
      </p>
    </>
  );

  // « Autour de moi » + sélecteur de zone : intégrés dans la barre de
  // résultats de l'écran Explorer (plus de bandeau flottant dédié — le retour
  // se fait via l'onglet Accueil / le logo, et la navigation en tuiles garde
  // ses propres tuiles cliquables).
  const zoneItems = [
    { key: "", label: "Toute", icon: "toute-lile" },
    ...ZONES.map((z) => ({ key: z.key, label: z.label, icon: z.key })),
  ];
  const zoneControls = (
    <div className="flex items-stretch gap-1.5">
      <button
        onClick={toggleNearMe}
        aria-pressed={nearMe}
        title="Autour de moi"
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold shrink-0 transition-colors ${
          nearMe ? "bg-primary text-white" : "bg-surface-2 text-ink"
        }`}
      >
        <MapPin size={14} weight={nearMe ? "fill" : "regular"} aria-hidden />
        {geoStatus === "loading" ? "Localisation…" : "Autour de moi"}
      </button>
      <div ref={zonePickerRef} className="relative min-w-0">
        <button
          onClick={() => setZonePickerOpen((o) => !o)}
          aria-expanded={zonePickerOpen}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold min-w-0 transition-colors ${
            !nearMe && activeZone ? "bg-primary text-white" : "bg-surface-2 text-ink"
          }`}
        >
          {(() => {
            const I = iconForKey(!nearMe && activeZone ? activeZone : "toute-lile");
            return I ? <I size={14} weight={!nearMe && activeZone ? "fill" : "regular"} aria-hidden /> : null;
          })()}
          <span className="truncate max-w-[130px]">
            {!nearMe && activeZone ? ZONES.find((z) => z.key === activeZone)?.label : "Toute l'île"}
          </span>
        </button>
        {zonePickerOpen && (
          <div className="absolute z-30 top-full mt-2 left-0 w-[220px] max-h-[320px] overflow-y-auto rounded-card border border-border bg-surface shadow-pop p-1.5">
            {zoneItems.map((z) => {
              const active = !nearMe && (activeZone ?? "") === z.key;
              const I = iconForKey(z.icon);
              const n = z.key ? zoneCounts[z.key] || 0 : rows.length;
              return (
                <button
                  key={z.key || "all"}
                  onClick={() => {
                    setNearMe(false);
                    setActiveZone(z.key || null);
                    setZonePickerOpen(false);
                    if (showHome) setBrowseAll(true);
                  }}
                  aria-pressed={active}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
                    active ? "bg-primary-tint text-primary-deep font-semibold" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {I ? <I size={16} weight={active ? "fill" : "regular"} aria-hidden /> : null}
                  <span className="flex-1 truncate">{z.label === "Toute" ? "Toute l'île" : z.label}</span>
                  <span className="text-[11px] font-bold opacity-55 shrink-0">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Barre de navigation principale (5 onglets) fixée tout en bas de l'écran :
  // Accueil / Favoris / Ajouter (bouton central relevé) / Explorer / Profil.
  const activeTab: "accueil" | "favoris" | "explorer" | "profil" | "autre" = homeMode === "favoris"
    ? "favoris"
    : homeMode === "profil"
      ? "profil"
      : showHome && navStack.length === 0 && homeMode === "menu"
        ? "accueil"
        : browseAll || navStack.length > 0 || homeMode === "categories"
          ? "explorer"
          : "autre";
  const tabBar = (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 inset-x-0 z-40 bg-band border-t border-band-deep"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-[640px] mx-auto grid grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
        <button
          onClick={goHome}
          aria-label="Accueil"
          aria-pressed={activeTab === "accueil"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "accueil" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <House size={22} weight={activeTab === "accueil" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Accueil</span>
        </button>
        <button
          onClick={() => {
            setBrowseAll(false);
            setNavStack([]);
            setHomeMode("favoris");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Favoris"
          aria-pressed={activeTab === "favoris"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "favoris" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <Heart size={22} weight={activeTab === "favoris" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Favoris</span>
        </button>
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              setBrowseAll(false);
              setNavStack([]);
              setHomeMode("ajouter");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            aria-label="Ajouter une adresse"
            className="w-11 h-11 -mt-5 rounded-full flex items-center justify-center text-on-band shadow-[0_2px_8px_rgba(0,0,0,0.25)] border-[3px] border-band active:scale-[.97] transition-transform"
            style={{ background: "var(--band-deep)" }}
          >
            <Plus size={22} weight="bold" aria-hidden />
          </button>
        </div>
        <button
          onClick={() => {
            setHomeMode("menu");
            setNavStack([]);
            setBrowseAll(true);
            setTimeout(focusSearch, 60);
          }}
          aria-label="Explorer"
          aria-pressed={activeTab === "explorer"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "explorer" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <Compass size={22} weight={activeTab === "explorer" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Explorer</span>
        </button>
        <button
          onClick={() => {
            setBrowseAll(false);
            setNavStack([]);
            setHomeMode("profil");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Profil"
          aria-pressed={activeTab === "profil"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "profil" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <UserCircle size={22} weight={activeTab === "profil" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Profil</span>
        </button>
      </div>
    </nav>
  );

  // Barre de filtres générique (menus déroulants Type / Prix / Ambiance).
  const typeOptions: DropdownOption[] = (activeSubgroup?.children ?? [])
    .filter((k) => (facetCounts.type[k] || 0) > 0)
    .map((k) => {
      const I = iconForKey(k);
      return {
        key: k,
        label: RUBRIQUE_MAP[k]?.label ?? k,
        count: facetCounts.type[k],
        icon: I ? <I size={14} weight="bold" aria-hidden /> : undefined,
      };
    });
  const priceOptions: DropdownOption[] = PRICE_RANGES.filter(
    (p) => (facetCounts.price[p.key] || 0) > 0
  ).map((p) => ({ key: p.key, label: `${p.symbol} ${p.label}`, count: facetCounts.price[p.key] }));
  const attrOptions: DropdownOption[] = isRestoView
    ? RESTO_ATTRS.filter((k) => (facetCounts.attr[k] || 0) > 0).map((k) => {
        const I = iconForKey(k);
        return {
          key: k,
          label: RUBRIQUE_MAP[k]?.label ?? k,
          count: facetCounts.attr[k],
          icon: I ? <I size={14} weight="bold" aria-hidden /> : undefined,
        };
      })
    : [];

  const badgeOptions: DropdownOption[] = BADGE_META.filter(
    (m) => (facetCounts.badge[m.key] || 0) > 0
  ).map((m) => ({
    key: m.key,
    label: m.label,
    count: facetCounts.badge[m.key],
    icon: <span aria-hidden>{m.emoji}</span>,
  }));

  const hasFacets =
    typeOptions.length > 0 || priceOptions.length > 0 || badgeOptions.length > 0 || attrOptions.length > 0;
  const restoFilterBar = activeRubrique && hasFacets ? (
    <div className="mb-3 border-b border-border pb-3 flex items-center gap-2">
      {badgeOptions.length > 0 && (
        <FilterDropdown
          label="Sélection"
          options={badgeOptions}
          selected={facetBadges}
          onToggle={(k) => toggleInSet(setFacetBadges, k)}
          onClear={() => setFacetBadges(new Set())}
        />
      )}
      {typeOptions.length > 0 && (
        <FilterDropdown
          label={activeSubgroup?.label ?? "Type"}
          options={typeOptions}
          selected={facetTypes}
          onToggle={(k) => toggleInSet(setFacetTypes, k)}
          onClear={() => setFacetTypes(new Set())}
        />
      )}
      {priceOptions.length > 0 && (
        <FilterDropdown
          label="Prix"
          options={priceOptions}
          selected={facetPrices}
          onToggle={(k) => toggleInSet(setFacetPrices, k)}
          onClear={() => setFacetPrices(new Set())}
        />
      )}
      {attrOptions.length > 0 && (
        <FilterDropdown
          label="Ambiance"
          options={attrOptions}
          selected={facetAttrs}
          onToggle={(k) => toggleInSet(setFacetAttrs, k)}
          onClear={() => setFacetAttrs(new Set())}
        />
      )}
      {facetActive && (
        <button
          onClick={resetRestoFacets}
          className="shrink-0 text-[12.5px] font-semibold text-primary-deep hover:underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="app min-h-screen flex flex-col">
      {/* En-tête « Lagon » : bandeau teal poulpe, logo clair + recherche */}
      <header className="sticky top-0 z-30 bg-band border-b border-band-deep shadow-sm">
        <div className="max-w-[1400px] mx-auto px-5 pt-2 pb-2.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={goHome}
              aria-label="Retour à l'accueil"
              className="rounded-lg px-1 py-1 hover:opacity-90 active:scale-[.98] transition"
            >
              <Logo light size={56} />
            </button>
          </div>
          {showHeaderSearch && (
            <div className="max-w-[640px]">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher une activité, un lieu, un nom…"
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto lg:flex min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-[270px] shrink-0 border-r border-border overflow-y-auto sticky top-[94px] max-h-[calc(100vh-94px)]">
          {sidebarContent}
        </aside>

        <div
          className={`flex-1 min-w-0 px-4 lg:px-5 ${
            showHome && navStack.length === 0 && homeMode === "menu"
              ? "py-3 overflow-hidden"
              : "py-3 pb-24"
          }`}
        >
          {/* Accueil « Option A » : menu d'entrée à 4 modes, figé sans scroll —
              les 4 tuiles remplissent tout l'espace disponible sous le bandeau
              et au-dessus de la barre d'onglets. */}
          {showHome && navStack.length === 0 && homeMode === "menu" && (
            <div className="h-[calc(100dvh-150px)] flex flex-col justify-center overflow-hidden">
              <div className="grid grid-cols-2 grid-rows-2 gap-4 sm:gap-5 w-full h-full max-w-[660px] max-h-[560px] mx-auto">
                <HomeEntry img="/icon-categories.png" title="Par catégorie" subtitle="8 univers" onClick={() => setHomeMode("categories")} />
                <HomeEntry img="/icon-recherche.png" title="Recherche" subtitle="lieu, nom, activité" onClick={() => { setBrowseAll(true); setTimeout(focusSearch, 60); }} />
                <HomeEntry img="/icon-favoris.png" title="Mes favoris" subtitle="et mes listes" onClick={() => setHomeMode("favoris")} />
                <HomeEntry img="/icon-listes.png" title="Listes de Koté Moris" subtitle="nos sélections" onClick={() => setHomeMode("listes")} />
              </div>
            </div>
          )}

          {/* Accueil → Par catégorie : catégories + sous-catégories populaires,
              façon rendu de référence. */}
          {showHome && navStack.length === 0 && homeMode === "categories" && (
            <div className="pb-16">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[16px] font-bold text-ink">Explorer par catégorie</h2>
                <button
                  onClick={() => setBrowseAll(true)}
                  className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  Voir tout ({rows.length}) ›
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 sm:max-w-[560px]">
                {MERGED_GROUPS.map((g) => {
                  const count = g.children.reduce((n, ck) => n + (umbrellaCounts[ck] || 0), 0);
                  if (count === 0) return null;
                  return (
                    <UniversCard
                      key={g.key}
                      photoKey={g.photoKey}
                      label={g.label}
                      subtitle={g.subtitle}
                      onClick={() => {
                        if (g.children.length === 1) {
                          const u = UMBRELLA_BY_KEY[g.children[0]];
                          pushNav({ kind: "umbrella", key: u.key, label: u.label, emoji: u.emoji });
                        } else {
                          pushNav({ kind: "merged", key: g.key, label: g.label, emoji: "" });
                        }
                      }}
                    />
                  );
                })}
              </div>

              {topRubriques.length > 0 && (
                <>
                  <h2 className="text-[16px] font-bold text-ink mt-7 mb-2.5">Sous-catégories populaires</h2>
                  <div className="flex flex-col gap-2 sm:max-w-[560px]">
                    {topRubriques.map((t) => (
                      <CategoryRow
                        key={t.key}
                        iconKey={t.key}
                        emoji={t.emoji}
                        label={t.label}
                        count={t.count}
                        onClick={() => toggleTheme(t.key)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center gap-4 mt-7 pt-3 border-t border-border">
                <button
                  onClick={() => setHomeMode("favoris")}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  <Heart size={16} weight="duotone" aria-hidden /> Mes favoris
                </button>
                <button
                  onClick={() => setHomeMode("listes")}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  <Star size={16} weight="duotone" aria-hidden /> Listes de Koté Moris
                </button>
              </div>
            </div>
          )}

          {/* Accueil → Mes favoris / Listes Koté Moris / Profil / Ajouter : écrans placeholder « bientôt ». */}
          {showHome &&
            navStack.length === 0 &&
            (homeMode === "favoris" || homeMode === "listes" || homeMode === "profil" || homeMode === "ajouter") && (
              <div className="pb-16">
                <div className="mt-6 max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 flex flex-col items-center gap-3">
                  <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
                    {homeMode === "favoris" && <Heart size={28} weight="duotone" aria-hidden />}
                    {homeMode === "listes" && <Star size={28} weight="duotone" aria-hidden />}
                    {homeMode === "profil" && <UserCircle size={28} weight="duotone" aria-hidden />}
                    {homeMode === "ajouter" && <Plus size={28} weight="bold" aria-hidden />}
                  </span>
                  <p className="font-serif text-lg font-semibold leading-tight">
                    {homeMode === "favoris" && "Mes favoris & mes listes"}
                    {homeMode === "listes" && "Les listes de Koté Moris"}
                    {homeMode === "profil" && "Mon profil"}
                    {homeMode === "ajouter" && "Ajouter une adresse"}
                  </p>
                  <p className="text-[13px] text-muted leading-snug">
                    {homeMode === "favoris" && "Enregistrez vos adresses préférées et créez vos propres listes."}
                    {homeMode === "listes" && "Nos sélections d'adresses par thématique, à découvrir très bientôt."}
                    {homeMode === "profil" && "Votre compte, vos préférences et votre historique, bientôt ici."}
                    {homeMode === "ajouter" && "Suggérez une adresse à ajouter à l'annuaire Koté Moris."}
                  </p>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold text-on-accent"
                    style={{ background: "var(--accent)" }}
                  >
                    ✨ Bientôt disponible
                  </span>
                </div>
              </div>
            )}

          {/* Niveau de navigation en tuiles (familles / rubriques / spécialités) */}
          {showHome &&
            navStack.length > 0 &&
            (() => {
              const tiles = levelTiles(navStack);
              const path = navStack.map((n) => n.label).join(" › ");
              const lockedNode = navStack.find((n) => PREMIUM_KEYS.has(n.key));
              const locked = !!lockedNode;
              return (
                <div className="pb-16">
                  {/* Repère de niveau figé sous le bandeau : retour + icône + fil d'ariane. */}
                  <div className="sticky top-[94px] z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                    <button
                      onClick={goBackFromResults}
                      aria-label="Retour"
                      className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                    >
                      <ArrowLeft size={17} weight="bold" aria-hidden />
                    </button>
                    {(() => {
                      const last = navStack[navStack.length - 1];
                      const I = iconForKey(last.key);
                      return I ? (
                        <span className="shrink-0 w-6 h-6 rounded-full bg-primary-tint text-primary-deep flex items-center justify-center">
                          <I size={13} weight="bold" aria-hidden />
                        </span>
                      ) : (
                        <span className="shrink-0">{last.emoji}</span>
                      );
                    })()}
                    <p className="text-[15px] font-semibold truncate">{path}</p>
                  </div>
                  <div className="h-2.5" />
                  <div className="relative min-h-[220px]">
                    <div
                      className={`flex flex-col gap-2 sm:max-w-[560px] sm:mx-auto ${
                        locked ? "blur-[3px] pointer-events-none select-none" : ""
                      }`}
                      aria-hidden={locked || undefined}
                    >
                      {tiles.map((t) => (
                        <CategoryRow
                          key={t.key}
                          iconKey={t.key.startsWith("__all__") ? t.key.slice(7) : t.key}
                          emoji={t.emoji}
                          label={t.label}
                          count={t.count}
                          onClick={() => onTileClick(t)}
                        />
                      ))}
                    </div>
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="max-w-[300px] w-full text-center bg-surface/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 flex flex-col items-center gap-2"
                          style={{ border: "2px solid var(--accent)" }}
                        >
                          <span className="text-3xl" aria-hidden>🔒</span>
                          <p className="font-serif text-lg font-semibold leading-tight">
                            Réservé aux membres Premium
                          </p>
                          <p className="text-[13px] text-muted leading-snug">
                            Débloquez « {lockedNode?.label} » et tout le contenu Premium de Koté Moris.
                          </p>
                          <button
                            disabled
                            className="mt-1 px-4 py-2 rounded-full font-bold text-on-accent cursor-not-allowed opacity-90"
                            style={{ background: "var(--accent)" }}
                          >
                            ✨ Devenir Premium
                          </button>
                          <span className="text-[11px] text-muted/80">Bientôt disponible</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Barre de résultats : retour + repère (icône + catégorie + total)
              + liste/carte, puis « Autour de moi » / zone sur une 2e ligne. */}
          <div className={`sticky top-[94px] z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 flex-col gap-2 py-2 border-b border-border mb-3 ${mobileTiles ? "hidden" : "flex"}`} style={{ background: "var(--bg)" }}>
            <div className="flex items-center gap-2">
              <button
                onClick={goBackFromResults}
                disabled={!canGoBack}
                aria-label="Retour"
                className={`shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center active:scale-[.95] transition-transform ${
                  canGoBack ? "text-ink" : "text-muted/40"
                }`}
              >
                <ArrowLeft size={17} weight="bold" aria-hidden />
              </button>
              {(() => {
                const I = iconForKey(breadcrumb.key);
                return I ? (
                  <span className="shrink-0 w-7 h-7 rounded-full bg-primary-tint text-primary-deep flex items-center justify-center">
                    <I size={15} weight="bold" aria-hidden />
                  </span>
                ) : (
                  <span className="shrink-0 text-[17px]">{breadcrumb.emoji}</span>
                );
              })()}
              <span className="text-[15px] font-semibold truncate">{breadcrumb.label}</span>
              <span className="text-[13px] text-muted shrink-0">
                — {visibleRows.length} résultat{visibleRows.length > 1 ? "s" : ""}
              </span>
              <div className="ml-auto inline-flex rounded-full border border-border overflow-hidden shrink-0">
                <button
                  onClick={() => { setNearMe(false); setResultsView("liste"); }}
                  className={`px-3 py-1.5 text-[13px] font-semibold ${
                    !nearMe && resultsView === "liste" ? "bg-primary text-white" : "bg-surface text-ink"
                  }`}
                >
                  Liste
                </button>
                <button
                  onClick={() => { setNearMe(false); setResultsView("carte"); }}
                  className={`px-3 py-1.5 text-[13px] font-semibold ${
                    !nearMe && resultsView === "carte" ? "bg-primary text-white" : "bg-surface text-ink"
                  }`}
                >
                  Carte
                </button>
              </div>
            </div>
            {zoneControls}
          </div>

          {geoStatus === "denied" && nearMe === false && (
            <p className="mb-3 text-[12.5px] text-muted">
              📍 Position refusée. Autorisez la localisation dans votre navigateur pour trier par distance.
            </p>
          )}
          {geoStatus === "unavailable" && (
            <p className="mb-3 text-[12.5px] text-muted">📍 Géolocalisation indisponible sur cet appareil.</p>
          )}

          {!mobileTiles && restoFilterBar}

          <div className={`lg:gap-4 lg:h-[calc(100vh-190px)] ${mobileTiles ? "hidden" : "lg:flex"}`}>
            {/* Liste */}
            <div
              className={`lg:w-[56%] lg:overflow-y-auto lg:pr-1 ${
                resultsView === "carte" ? "hidden lg:block" : ""
              }`}
            >
              {visibleRows.length === 0 ? (
                <div className="text-center py-[70px] px-5 text-muted">
                  <div className="text-4xl mb-2.5">🔍</div>
                  {filterByMap
                    ? "Aucune adresse dans cette zone. Dézoomez, déplacez la carte, ou décochez « N'afficher que la zone de la carte »."
                    : "Aucun résultat. Essayez un autre mot-clé ou une autre catégorie."}
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-16">
                  {visibleRows.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      active={b.id === selectedId || b.id === hoveredId}
                      onSelect={selectFromCard}
                      onHover={setHoveredId}
                      nearbyKm={nearMe ? distanceById[b.id] : undefined}
                      hiddenKeys={ficheHiddenKeys}
                      cardRef={(el) => {
                        cardRefs.current[b.id] = el;
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Carte */}
            <div
              className={`lg:w-[44%] lg:h-full mt-3 lg:mt-0 ${
                resultsView === "liste" ? "hidden lg:block" : ""
              }`}
            >
              <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden h-[60vh] lg:h-full flex flex-col">
                <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 border-b border-border">
                  <span className="text-[12.5px] text-muted">Carte des activités — positions GPS</span>
                  <label className="inline-flex items-center gap-2 text-[12.5px] font-medium text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterByMap}
                      onChange={(e) => setFilterByMap(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Zone visible uniquement
                  </label>
                </div>
                <div className="flex-1 min-h-0 bg-surface-2">
                  <Map
                    businesses={rows}
                    selectedId={selectedId}
                    onSelect={selectFromMap}
                    onBoundsChange={onBoundsChange}
                    fitKey={`${active}|${[...activeThemes].join(",")}|${activeZone ?? ""}`}
                    hoveredId={hoveredId}
                    onHover={setHoveredId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vue détail plein écran d'une fiche (clic sur une carte). */}
      {openBusiness && (
        <BusinessDetail
          business={openBusiness}
          onClose={() => setOpenId(null)}
          hiddenKeys={ficheHiddenKeys}
        />
      )}

      {/* Barre de navigation principale (5 onglets), tout en bas de l'écran. */}
      {tabBar}
    </div>
  );
}
