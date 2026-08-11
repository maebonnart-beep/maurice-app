"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business, CategoryKey } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, FAMILIES, PRICE_RANGES } from "@/data/categories";
import type { Family, Subgroup } from "@/data/categories";
import { Logo } from "@/components/ui/Logo";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { FilterDropdown, type DropdownOption } from "@/components/ui/FilterDropdown";
import { iconForKey, MapPin } from "@/lib/icons";

// Facettes de filtrage propres aux restaurants (rubrique "restaurants").
const RESTO_CUISINES = [
  "mauricienne", "fruits-de-mer", "indienne", "asiatique", "sushis",
  "europeenne", "italien", "grillades", "vegetarien",
];
const RESTO_ATTRS = ["tables-exception", "plus-belles-vues", "frequente-locaux", "kids-friendly"];

const UNCLASSIFIED = "__unclassified__";
const SIDEBAR_VISIBLE_RUBRIQUES = 5;

// Univers « lifestyle » de l'accueil (couche de présentation au-dessus des rubriques).
// Chaque univers = un regroupement de catégories entières et/ou de rubriques précises.
type Umbrella = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  categories?: CategoryKey[];
  rubriques?: string[];
};

const LIFESTYLE: Umbrella[] = [
  { key: "manger", label: "Manger", emoji: "🍽️", color: "#e2725b", categories: ["food"] },
  {
    key: "sortir",
    label: "Sortir",
    emoji: "🍹",
    color: "#c9457a",
    rubriques: [
      "bars", "cafes-terrasses", "rhumeries", "casinos", "cinemas", "bowling",
      "karting", "escape-game", "culture-patrimoine", "glaciers", "snacks-plage",
    ],
    categories: ["evenements"],
  },
  {
    key: "bouger",
    label: "Bouger",
    emoji: "🏃",
    color: "#087e8b",
    rubriques: [
      "complexes-sportifs", "gym-fitness", "sports-nautiques", "golf", "tennis-padel",
      "randonnee-trail", "centres-equestres", "peche", "plages",
      "parcs-nationaux-cascades", "excursions", "parcs-aventures", "parcs-animaliers",
      "parcs-botaniques",
    ],
  },
  {
    key: "shopping",
    label: "Shopping",
    emoji: "🛍️",
    color: "#7c5cf0",
    rubriques: [
      "malls", "shopping", "mode-adultes", "mode-enfants", "materiel-sports",
      "livres", "jeux", "souvenirs", "equipement-maison",
    ],
    categories: ["seconde-main"],
  },
  {
    key: "famille",
    label: "Famille",
    emoji: "👨‍👩‍👧",
    color: "#3f7cac",
    rubriques: ["activites-enfants-famille", "centres-loisirs-animations-enfants", "kids-friendly"],
    categories: ["education"],
  },
  {
    key: "pratique",
    label: "Pratique",
    emoji: "🧰",
    color: "#4a6572",
    categories: ["utiles", "immobilier", "business-ttv", "soins-bien-etre", "coaching"],
  },
];

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
type NavNode = { kind: "umbrella" | "family" | "subgroup"; key: string; label: string; emoji: string };

const ZONES: { key: string; label: string; emoji: string }[] = [
  { key: "nord", label: "Nord", emoji: "⬆️" },
  { key: "est", label: "Est", emoji: "➡️" },
  { key: "sud", label: "Sud", emoji: "⬇️" },
  { key: "ouest", label: "Ouest", emoji: "⬅️" },
  { key: "centre", label: "Centre", emoji: "🎯" },
];

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
  // Facettes restaurants (cuisine / prix / ambiance) — multi-sélection.
  const [restoCuisines, setRestoCuisines] = useState<Set<string>>(new Set());
  const [restoPrices, setRestoPrices] = useState<Set<string>>(new Set());
  const [restoAttrs, setRestoAttrs] = useState<Set<string>>(new Set());
  const [expandedInSidebar, setExpandedInSidebar] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resultsView, setResultsView] = useState<"liste" | "carte">("liste");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Mobile : forcer la liste à plat malgré l'écran d'accueil par catégories.
  const [browseAll, setBrowseAll] = useState(false);
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
    setRestoCuisines(new Set());
    setRestoPrices(new Set());
    setRestoAttrs(new Set());
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
    setSidebarOpen(false);
    resetRestoFacets();
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // Mobile : garder le tiroir ouvert quand la catégorie a une arborescence
    // de rubriques à dérouler (l'utilisateur peut alors choisir une
    // sous-rubrique). On ne referme que pour les catégories sans arborescence.
    const hasTree = !!SUBCATEGORIES[key as keyof typeof SUBCATEGORIES];
    if (!hasTree) setSidebarOpen(false);
  }

  function toggleZone(key: string) {
    setActiveZone((prev) => (prev === key ? null : key));
  }

  function toggleTheme(key: string) {
    setActiveThemes((prev) => (prev.has(key) ? new Set() : new Set([key])));
    setSidebarOpen(false);
    resetRestoFacets(); // les facettes ne valent que pour la vue restaurants courante
    // On conserve la pile de navigation en tuiles : le bouton « Retour » de la
    // page de résultats ramène ainsi à la grille de tuiles du bon niveau.
  }

  // Bouton « Retour » de la page de résultats : revient d'un cran (rubrique →
  // tuiles → accueil) au lieu de tout réinitialiser.
  function goBackFromResults() {
    if (activeThemes.size > 0) {
      setActiveThemes(new Set()); // retour aux tuiles du niveau courant
      return;
    }
    if (browseAll) {
      setBrowseAll(false);
      return;
    }
    if (active !== "all") {
      setActive("all");
      setNavStack([]);
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

  // Vue restaurants → on propose les facettes cuisine / prix / ambiance.
  const isRestoView = activeThemes.has("restaurants");

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
        // Facettes restaurants : cuisine (OU), prix (OU), ambiance (ET).
        if (isRestoView) {
          const themes = b.themes || [];
          if (restoCuisines.size > 0 && !themes.some((t) => restoCuisines.has(t))) return false;
          if (restoPrices.size > 0 && !(b.priceRange && restoPrices.has(b.priceRange))) return false;
          if (restoAttrs.size > 0 && ![...restoAttrs].every((a) => themes.includes(a))) return false;
        }
        if (!q) return true;
        return (b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label)
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0));
  }, [businesses, query, active, activeThemes, activeZone, isRestoView, restoCuisines, restoPrices, restoAttrs]);

  // Base restaurants (rubrique + zone + recherche, hors facettes) pour les compteurs de chips.
  const restoFacetCounts = useMemo(() => {
    const cuisine: Record<string, number> = {};
    const price: Record<string, number> = {};
    const attr: Record<string, number> = {};
    if (!isRestoView) return { cuisine, price, attr, total: 0 };
    const q = query.trim().toLowerCase();
    let total = 0;
    businesses.forEach((b) => {
      if (!(b.themes || []).includes("restaurants")) return;
      if (activeZone && b.zone !== activeZone) return;
      if (q && !(b.name + " " + b.address).toLowerCase().includes(q)) return;
      total++;
      (b.themes || []).forEach((t) => {
        if (RESTO_CUISINES.includes(t)) cuisine[t] = (cuisine[t] || 0) + 1;
        if (RESTO_ATTRS.includes(t)) attr[t] = (attr[t] || 0) + 1;
      });
      if (b.priceRange) price[b.priceRange] = (price[b.priceRange] || 0) + 1;
    });
    return { cuisine, price, attr, total };
  }, [businesses, isRestoView, activeZone, query]);

  const restoFacetActive = restoCuisines.size + restoPrices.size + restoAttrs.size > 0;

  // Cartes affichées : limitées à la zone visible de la carte si le filtre est actif.
  const visibleRows = useMemo(() => {
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
    // « Restaurants » ouvre directement la liste filtrable (les cuisines sont
    // proposées comme facettes) au lieu de descendre dans un sous-groupe de tuiles.
    const sg = r.key === "restaurants" ? undefined : SUBGROUP_BY_PARENT[r.key];
    return sg
      ? { key: r.key, label: r.label, emoji: r.emoji, count, drillTo: { kind: "subgroup", key: r.key, label: r.label, emoji: r.emoji } }
      : { key: r.key, label: r.label, emoji: r.emoji, count, themeKey: r.key };
  }

  // Tuiles du niveau courant de la pile de navigation.
  function levelTiles(stack: NavNode[]): TileDesc[] {
    const top = stack[stack.length - 1];
    if (!top) return [];
    if (top.kind === "umbrella") {
      const u = LIFESTYLE.find((x) => x.key === top.key);
      if (!u) return [];
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

  // Sélecteur de région compact, placé dans le bandeau à droite du logo.
  const headerZoneSelect = (
    <div className="flex items-center gap-1.5 shrink-0">
      <MapPin size={16} weight="fill" className="text-on-band/80" aria-hidden />
      <select
        value={activeZone ?? ""}
        onChange={(e) => setActiveZone(e.target.value || null)}
        aria-label="Région"
        style={{ colorScheme: "dark" }}
        className="bg-white/15 text-on-band text-[13px] font-semibold rounded-pill pl-3 pr-2 py-1.5 border border-white/25 focus:outline-none focus:border-white/60 cursor-pointer"
      >
        <option value="">Toute l&apos;île</option>
        {ZONES.map((z) => (
          <option key={z.key} value={z.key}>
            {z.label} ({zoneCounts[z.key] || 0})
          </option>
        ))}
      </select>
    </div>
  );

  // Barre de filtres restaurants (menus déroulants Cuisine / Prix / Ambiance).
  const cuisineOptions: DropdownOption[] = RESTO_CUISINES.filter(
    (k) => (restoFacetCounts.cuisine[k] || 0) > 0
  ).map((k) => {
    const I = iconForKey(k);
    return {
      key: k,
      label: RUBRIQUE_MAP[k]?.label ?? k,
      count: restoFacetCounts.cuisine[k],
      icon: I ? <I size={14} weight="bold" aria-hidden /> : undefined,
    };
  });
  const priceOptions: DropdownOption[] = PRICE_RANGES.filter(
    (p) => (restoFacetCounts.price[p.key] || 0) > 0
  ).map((p) => ({ key: p.key, label: `${p.symbol} ${p.label}`, count: restoFacetCounts.price[p.key] }));
  const attrOptions: DropdownOption[] = RESTO_ATTRS.filter(
    (k) => (restoFacetCounts.attr[k] || 0) > 0
  ).map((k) => {
    const I = iconForKey(k);
    return {
      key: k,
      label: RUBRIQUE_MAP[k]?.label ?? k,
      count: restoFacetCounts.attr[k],
      icon: I ? <I size={14} weight="bold" aria-hidden /> : undefined,
    };
  });

  const restoFilterBar = isRestoView ? (
    <div className="mb-3 border-b border-border pb-3 flex flex-wrap items-center gap-2">
      {cuisineOptions.length > 0 && (
        <FilterDropdown
          label="Cuisine"
          options={cuisineOptions}
          selected={restoCuisines}
          onToggle={(k) => toggleInSet(setRestoCuisines, k)}
          onClear={() => setRestoCuisines(new Set())}
        />
      )}
      {priceOptions.length > 0 && (
        <FilterDropdown
          label="Prix"
          options={priceOptions}
          selected={restoPrices}
          onToggle={(k) => toggleInSet(setRestoPrices, k)}
          onClear={() => setRestoPrices(new Set())}
        />
      )}
      {attrOptions.length > 0 && (
        <FilterDropdown
          label="Ambiance"
          options={attrOptions}
          selected={restoAttrs}
          onToggle={(k) => toggleInSet(setRestoAttrs, k)}
          onClear={() => setRestoAttrs(new Set())}
        />
      )}
      {restoFacetActive && (
        <button
          onClick={resetRestoFacets}
          className="text-[12.5px] font-semibold text-primary-deep hover:underline"
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
        <div className="max-w-[1400px] mx-auto px-5 pt-3 pb-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goHome}
              aria-label="Retour à l'accueil"
              className="rounded-lg -ml-1 px-1 py-1 hover:opacity-90 active:scale-[.98] transition"
            >
              <Logo light />
            </button>
            {headerZoneSelect}
          </div>
          <div className="max-w-[640px]">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher une activité, un lieu, un nom…"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto lg:flex min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-[270px] shrink-0 border-r border-border overflow-y-auto sticky top-[121px] max-h-[calc(100vh-121px)]">
          {sidebarContent}
        </aside>

        {/* Sidebar mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-[85%] max-w-[320px] h-full bg-surface overflow-y-auto shadow-pop">
              <div className="sticky top-0 z-20 bg-surface flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-bold">Catégories</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Fermer"
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-2 font-bold"
                >
                  ×
                </button>
              </div>
              {sidebarContent}
              <div className="sticky bottom-0 bg-surface border-t border-border p-3">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-[14px]"
                >
                  Voir {visibleRows.length} résultat{visibleRows.length > 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 px-4 lg:px-5 py-3">
          {/* Accueil : grille des univers lifestyle */}
          {showHome && navStack.length === 0 && (
            <div className="pb-16">
              <p className="text-[13px] font-semibold text-muted mb-2.5">Que cherchez-vous ?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {LIFESTYLE.filter((u) => (umbrellaCounts[u.key] || 0) > 0).map((u) => (
                  <CategoryTile
                    key={u.key}
                    iconKey={u.key}
                    emoji={u.emoji}
                    label={u.label}
                    count={umbrellaCounts[u.key] || 0}
                    onClick={() => pushNav({ kind: "umbrella", key: u.key, label: u.label, emoji: u.emoji })}
                  />
                ))}
              </div>
              <button
                onClick={() => setBrowseAll(true)}
                className="w-full mt-3 py-2.5 rounded-xl border border-border bg-surface text-[13.5px] font-semibold text-primary-deep active:scale-[.99] transition-transform"
              >
                Voir toutes les adresses ({rows.length})
              </button>
            </div>
          )}

          {/* Niveau de navigation en tuiles (familles / rubriques / spécialités) */}
          {showHome &&
            navStack.length > 0 &&
            (() => {
              const tiles = levelTiles(navStack);
              const path = navStack.map((n) => n.label).join(" › ");
              return (
                <div className="pb-16">
                  <button
                    onClick={() => setNavStack((prev) => prev.slice(0, -1))}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep mb-2.5 active:scale-[.98]"
                  >
                    ← Retour
                  </button>
                  <p className="text-[15px] font-semibold mb-2.5 truncate">{path}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {tiles.map((t) => (
                      <CategoryTile
                        key={t.key}
                        iconKey={t.key.startsWith("__all__") ? t.key.slice(7) : t.key}
                        emoji={t.emoji}
                        label={t.label}
                        count={t.count}
                        onClick={() => onTileClick(t)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

          {/* Barre de résultats */}
          <div className={`items-center justify-between gap-3 flex-wrap py-2 border-b border-border mb-3 ${mobileTiles ? "hidden" : "flex"}`}>
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={goBackFromResults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-[13px] font-semibold shrink-0 text-primary-deep active:scale-[.98]"
              >
                ← Retour
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface text-[13px] font-semibold shrink-0"
              >
                🗂️ Filtres
              </button>
              <span className="text-[15px] font-semibold truncate">
                {breadcrumb.emoji} {breadcrumb.label}
              </span>
              <span className="text-[13px] text-muted shrink-0">
                — {visibleRows.length} résultat{visibleRows.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="lg:hidden inline-flex rounded-full border border-border overflow-hidden shrink-0">
              <button
                onClick={() => setResultsView("liste")}
                className={`px-3 py-1.5 text-[13px] font-semibold ${
                  resultsView === "liste" ? "bg-primary text-white" : "bg-surface text-ink"
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setResultsView("carte")}
                className={`px-3 py-1.5 text-[13px] font-semibold ${
                  resultsView === "carte" ? "bg-primary text-white" : "bg-surface text-ink"
                }`}
              >
                Carte
              </button>
            </div>
          </div>

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
        <BusinessDetail business={openBusiness} onClose={() => setOpenId(null)} />
      )}

    </div>
  );
}
