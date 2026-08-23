"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business, CategoryKey } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, FILTER_GROUPS, PRICE_RANGES } from "@/data/categories";
import type { FilterGroup } from "@/data/categories";
import { SELECTIONS, SELECTION_GROUP_META } from "@/data/selections";
import type { SelectionGroup, SelectionIconKey } from "@/data/selections";
import { fuzzyMatch } from "@/lib/fuzzyMatch";

const SELECTION_ICONS: Record<SelectionIconKey, Icon> = {
  CloudRain,
  Users,
  PiggyBank,
  Heart,
  Martini,
  MoonStars,
  SunHorizon,
  Lightning,
  ForkKnife,
  Basket,
  Camera,
  Waves,
  Leaf,
  Binoculars,
  Compass,
  Mountains,
  Wind,
  TreePalm,
  Sparkle,
};
import { Logo } from "@/components/ui/Logo";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryRow } from "@/components/ui/CategoryRow";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { useFavorites } from "@/lib/favorites";
import { COUP_DE_COEUR_COLOR } from "@/components/ui/Badge";
import { FilterDropdown, type DropdownOption } from "@/components/ui/FilterDropdown";
import { AddAddressForm } from "@/components/ui/AddAddressForm";
import { iconForKey, mascotFor, categoryTint, MapPin } from "@/lib/icons";
import { displayName, displayCity } from "@/lib/format";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import {
  Heart,
  Flag,
  CheckCircle,
  Star,
  ArrowLeft,
  House,
  Compass,
  Plus,
  UserCircle,
  CloudRain,
  Users,
  PiggyBank,
  Martini,
  MoonStars,
  SunHorizon,
  Lightning,
  ForkKnife,
  Basket,
  Camera,
  Waves,
  Leaf,
  Binoculars,
  Mountains,
  Wind,
  TreePalm,
  Sparkle,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

// Badges → facette « Sélection » (coups de cœur & recommandations), toutes rubriques.
const BADGE_META: { key: string; label: string; emoji: string }[] = [
  { key: "selection", label: "Sélection Koté Moris", emoji: "🏅" },
  { key: "partenaire", label: "Partenaire", emoji: "⭐" },
];

const UNCLASSIFIED = "__unclassified__";
const SIDEBAR_VISIBLE_RUBRIQUES = 5;

// Catégories/rubriques réservées aux membres Premium (aperçu verrouillé).
// « evenements » → « agenda » (verrou de catégorie entière, inchangé).
// « seconde-main » n'est plus une catégorie mais 2 rubriques dans « acheter-equiper »
// (seconde-main-boutiques / seconde-main-particuliers) → verrou au niveau rubrique.
const PREMIUM_CATEGORY_KEYS = new Set<CategoryKey>(["agenda"]);
const PREMIUM_RUBRIQUE_KEYS = new Set<string>(["seconde-main-particuliers"]);

// Métadonnées de rubrique (emoji/libellé) par clé, tous univers confondus.
const RUBRIQUE_MAP: Record<string, { key: string; label: string; emoji: string }> = Object.fromEntries(
  Object.values(SUBCATEGORIES)
    .flat()
    .map((s) => [s.key, s])
);

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
  const { statuses: favoriteStatuses } = useFavorites();
  const favoriteBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "favori"),
    [businesses, favoriteStatuses]
  );
  const aTesterBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "a-tester"),
    [businesses, favoriteStatuses]
  );
  const testeBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "teste"),
    [businesses, favoriteStatuses]
  );
  // Favoris → carte : coups de cœur + à tester + testé réunis (fiches sans GPS ignorées par <Map>).
  const favorisMapBusinesses = useMemo(
    () => [...favoriteBusinesses, ...aTesterBusinesses, ...testeBusinesses],
    [favoriteBusinesses, aTesterBusinesses, testeBusinesses]
  );
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const zonePickerRef = useRef<HTMLDivElement>(null);
  // Facettes de rubrique — multi-sélection. Une entrée par groupe de filtre
  // transversal (cf. FILTER_GROUPS), plus prix et badges qui ne dépendent pas
  // de la taxonomie.
  const [facetGroups, setFacetGroups] = useState<Record<string, Set<string>>>({});
  const [facetPrices, setFacetPrices] = useState<Set<string>>(new Set());
  const [facetBadges, setFacetBadges] = useState<Set<string>>(new Set());
  const [expandedInSidebar, setExpandedInSidebar] = useState<Set<string>>(new Set());
  const [resultsView, setResultsView] = useState<"liste" | "carte">("liste");
  // Favoris : bascule optionnelle liste ↔ carte (pas affichée par défaut).
  const [favorisMapOpen, setFavorisMapOpen] = useState(false);
  // « Autour de moi » : tri par distance depuis la position de l'utilisateur.
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "unavailable" | "ok">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // Accueil → Listes de Koté Moris : sélection éditoriale ouverte (null = grille des sélections).
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  // Filtre de la grille "Explorer toutes nos sélections" (Tous / Besoins / Envies / Escapades).
  const [selectionExploreFilter, setSelectionExploreFilter] = useState<SelectionGroup | "tous">("tous");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Mobile : forcer la liste à plat malgré l'écran d'accueil par catégories.
  const [browseAll, setBrowseAll] = useState(false);
  // Accueil « Option A » : menu d'entrée → puis mode choisi.
  const [homeMode, setHomeMode] = useState<
    "menu" | "categories" | "favoris" | "listes" | "ajouter" | "profil"
  >("menu");
  // Accueil « Par catégorie » : catégorie choisie, dont on affiche les rubriques
  // (un seul niveau de profondeur). null = grille des 8 catégories.
  const [homeCategory, setHomeCategory] = useState<CategoryKey | null>(null);
  // Accueil « Par catégorie » → rubrique choisie qui a des sous-rubriques
  // (cf. FILTER_GROUPS[].browsable) : page intermédiaire avant les résultats.
  const [homeSubRubrique, setHomeSubRubrique] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const favorisSectionRef = useRef<HTMLDivElement>(null);
  const aTesterSectionRef = useRef<HTMLDivElement>(null);
  const testeSectionRef = useRef<HTMLDivElement>(null);

  const onBoundsChange = useCallback((b: MapBounds) => setMapBounds(b), []);

  // Quitte l'écran d'accueil "Listes de Koté Moris" → referme la sélection ouverte.
  useEffect(() => {
    if (homeMode !== "listes") setSelectedListId(null);
  }, [homeMode]);

  const businessById = useMemo(() => {
    const record: Record<string, Business> = {};
    businesses.forEach((b) => { record[b.id] = b; });
    return record;
  }, [businesses]);

  const selectedList = selectedListId ? SELECTIONS.find((s) => s.id === selectedListId) ?? null : null;
  const selectedListBusinesses = useMemo(
    () => (selectedList ? selectedList.businessIds.map((id) => businessById[id]).filter((b): b is Business => !!b) : []),
    [selectedList, businessById]
  );
  // Mises en avant : les sélections "featured" + toutes les escapades (weekends/journées), en grandes cartes photo.
  const highlightSelections = useMemo(
    () => SELECTIONS.filter((s) => s.featured || s.group === "escapades"),
    []
  );
  const exploreSelections = useMemo(
    () => (selectionExploreFilter === "tous" ? SELECTIONS : SELECTIONS.filter((s) => s.group === selectionExploreFilter)),
    [selectionExploreFilter]
  );

  const subcategories = SUBCATEGORIES[active as keyof typeof SUBCATEGORIES];

  function resetFacets() {
    setFacetGroups({});
    setFacetPrices(new Set());
    setFacetBadges(new Set());
  }

  // Bascule une valeur dans le Set d'un groupe de filtre donné.
  function toggleFacetGroup(groupKey: string, key: string) {
    setFacetGroups((prev) => {
      const cur = new Set(prev[groupKey] ?? []);
      if (cur.has(key)) cur.delete(key);
      else cur.add(key);
      return { ...prev, [groupKey]: cur };
    });
  }

  function clearFacetGroup(groupKey: string) {
    setFacetGroups((prev) => ({ ...prev, [groupKey]: new Set() }));
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
    setHomeCategory(null);
    setHomeMode("menu");
    resetFacets();
    setNearMe(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Entrée « Recherche » du menu d'accueil : focalise le champ de recherche du bandeau.
  function focusSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    (document.querySelector('header input[type="search"]') as HTMLInputElement | null)?.focus();
  }

  function selectCategory(key: string) {
    setActive(key);
    setActiveThemes(new Set());
    setBrowseAll(false);
    setHomeCategory(null);
  }

  // Chip de catégorie mobile dans les résultats/carte (cf. sidebar desktop,
  // masquée sur mobile) : filtre sans quitter la vue courante (liste/carte).
  function selectCategoryChip(key: string) {
    setActive((prev) => (prev === key ? "all" : key));
    setActiveThemes(new Set());
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

  // Groupe de filtre « browsable » (page de sous-rubriques) applicable à une
  // rubrique donnée, s'il existe.
  function browsableGroupFor(rubriqueKey: string): FilterGroup | undefined {
    return FILTER_GROUPS.find((g) => g.browsable && g.appliesTo.includes(rubriqueKey));
  }

  // Depuis la liste de rubriques : ouvre la page de sous-rubriques si la
  // rubrique en a, sinon va directement aux résultats (comportement d'avant).
  function openRubrique(key: string) {
    if (browsableGroupFor(key)) {
      setHomeSubRubrique(key);
    } else {
      toggleTheme(key);
    }
  }

  // Depuis la page de sous-rubriques : sélectionne la rubrique + la facette
  // choisie, puis va aux résultats déjà filtrés.
  function selectSubRubrique(rubriqueKey: string, group: FilterGroup, optionKey: string) {
    toggleTheme(rubriqueKey);
    toggleFacetGroup(group.key, optionKey);
    setHomeSubRubrique(null);
  }

  function toggleTheme(key: string) {
    setActiveThemes((prev) => (prev.has(key) ? new Set() : new Set([key])));
    resetFacets(); // les facettes ne valent que pour la rubrique courante
    // On conserve homeCategory : le bouton « Retour » de la page de résultats
    // ramène ainsi à la liste de rubriques de la bonne catégorie.
  }

  // Bouton « Retour » unifié : revient d'un cran (résultats → liste de
  // rubriques → sous-menu d'accueil → menu) au lieu de tout réinitialiser.
  // Utilisé par les bandeaux sticky de l'accueil et de la liste de résultats.
  const canGoBack =
    homeSubRubrique !== null || homeCategory !== null || activeThemes.size > 0 || browseAll || active !== "all" || homeMode !== "menu";
  function goBackFromResults() {
    if (homeSubRubrique !== null) {
      setHomeSubRubrique(null); // retour à la liste de rubriques
      return;
    }
    if (activeThemes.size > 0) {
      setActiveThemes(new Set()); // retour à la liste de rubriques (ou à la grille catégories)
      return;
    }
    if (homeCategory !== null) {
      setHomeCategory(null); // remonte à la grille des catégories
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

  // Accueil → « Nos coups de cœur » : fiches mises en avant par la rédaction,
  // limitées à celles qui ont une photo (essentiel pour ce format en carte photo).
  const coupsDeCoeur = useMemo(
    () => businesses.filter((b) => b.badge === "selection" && b.photoUrl),
    [businesses]
  );

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

  // Rubrique active (une seule) → détermine les groupes de filtre applicables.
  const activeRubrique =
    activeThemes.size === 1 && !activeThemes.has(UNCLASSIFIED) ? [...activeThemes][0] : null;
  // Groupes de filtre transversaux applicables à la rubrique active (0, 1 ou plusieurs).
  const applicableFilterGroups: FilterGroup[] = activeRubrique
    ? FILTER_GROUPS.filter((g) => g.appliesTo.includes(activeRubrique))
    : [];

  // « Ménage » des fiches : on masque les tags déjà impliqués par le contexte de
  // navigation/filtre actif (rubriques + facettes sélectionnées). Le badge de
  // catégorie a été retiré des fiches (redondant avec la navigation par univers).
  const ficheHiddenKeys = useMemo(() => {
    const s = new Set<string>();
    activeThemes.forEach((k) => { if (k !== UNCLASSIFIED) s.add(k); });
    Object.values(facetGroups).forEach((set) => set.forEach((k) => s.add(k)));
    facetPrices.forEach((k) => s.add(k));
    return s;
  }, [activeThemes, facetGroups, facetPrices]);

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
        // Facettes de rubrique : chaque groupe de filtre applicable (OU en son
        // sein) — testé sur b.filters, uniquement quand une rubrique est active.
        if (activeRubrique) {
          const filters = b.filters || [];
          for (const g of applicableFilterGroups) {
            const sel = facetGroups[g.key];
            if (sel && sel.size > 0 && !filters.some((f) => sel.has(f))) return false;
          }
        }
        // Prix et sélection/badge : facettes transversales, indépendantes de la rubrique.
        if (facetPrices.size > 0 && !(b.priceRange && facetPrices.has(b.priceRange))) return false;
        if (facetBadges.size > 0 && !(b.badge && facetBadges.has(b.badge))) return false;
        if (!q) return true;
        const rubriqueLabels = (b.themes || []).map((t) => RUBRIQUE_MAP[t]?.label || "").join(" ");
        return fuzzyMatch(
          b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label + " " + rubriqueLabels,
          q
        );
      })
      .sort((a, b) => (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0));
  }, [businesses, query, active, activeThemes, activeZone, activeRubrique, applicableFilterGroups, facetGroups, facetPrices, facetBadges]);

  // Base rubrique (rubrique + zone + recherche, hors facettes) pour les compteurs.
  const facetCounts = useMemo(() => {
    const perGroup: Record<string, Record<string, number>> = {};
    const price: Record<string, number> = {};
    const badge: Record<string, number> = {};
    if (!activeRubrique) return { perGroup, price, badge, total: 0 };
    const groups = FILTER_GROUPS.filter((g) => g.appliesTo.includes(activeRubrique));
    groups.forEach((g) => (perGroup[g.key] = {}));
    const q = query.trim().toLowerCase();
    let total = 0;
    businesses.forEach((b) => {
      if (!(b.themes || []).includes(activeRubrique)) return;
      if (activeZone && b.zone !== activeZone) return;
      if (q && !fuzzyMatch(b.name + " " + b.address, q)) return;
      total++;
      const filters = b.filters || [];
      groups.forEach((g) => {
        const optionKeys = new Set(g.options.map((o) => o.key));
        filters.forEach((f) => {
          if (optionKeys.has(f)) perGroup[g.key][f] = (perGroup[g.key][f] || 0) + 1;
        });
      });
      if (b.priceRange) price[b.priceRange] = (price[b.priceRange] || 0) + 1;
      if (b.badge) badge[b.badge] = (badge[b.badge] || 0) + 1;
    });
    return { perGroup, price, badge, total };
  }, [businesses, activeRubrique, activeZone, query]);

  // Compteurs par option pour la page de sous-rubriques (avant sélection de
  // rubrique/facette — donc indépendant de activeRubrique/facetGroups).
  const subRubriqueCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!homeSubRubrique) return c;
    businesses.forEach((b) => {
      if (!(b.themes || []).includes(homeSubRubrique)) return;
      (b.filters || []).forEach((f) => {
        c[f] = (c[f] || 0) + 1;
      });
    });
    return c;
  }, [businesses, homeSubRubrique]);

  const facetActive =
    Object.values(facetGroups).reduce((n, set) => n + set.size, 0) + facetPrices.size + facetBadges.size > 0;

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
        if (showHome) setBrowseAll(true);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // Localise silencieusement (sans activer le tri « Autour de moi ») pour
  // afficher le point « vous êtes ici » dès l'ouverture de la carte.
  function requestUserPosSilently() {
    if (userPos || geoStatus !== "idle") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
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

  // Écran d'accueil : 8 catégories plutôt que 2574 résultats en vrac.
  const showHome =
    active === "all" && activeThemes.size === 0 && query.trim() === "" && !browseAll;

  // On montre des tuiles (catégories / rubriques) plutôt que la liste.
  const mobileTiles = showHome;

  // Recherche affichée seulement dans le flux dédié (tuile « Recherche »,
  // onglet « Explorer », ou « Voir tout ») — pas pendant la navigation par
  // rubrique, où elle n'apporte rien et prend de la place.
  const showHeaderSearch = browseAll;

  // Rubriques les plus fournies toutes catégories confondues, pour la section
  // « Sous-catégories populaires » de l'accueil (grille des 8 catégories).
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

  const breadcrumb =
    activeThemeLabel ??
    (active !== "all"
      ? { key: active, emoji: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].emoji, label: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].label }
      : { key: "all", emoji: "✨", label: "Tout" });

  // Verrou Premium : catégorie entière (agenda) ou rubrique précise
  // (seconde-main-particuliers, dans acheter-equiper — seconde-main-boutiques reste libre).
  const activeCategoryLocked =
    (active !== "all" && PREMIUM_CATEGORY_KEYS.has(active as CategoryKey)) ||
    (activeRubrique !== null && PREMIUM_RUBRIQUE_KEYS.has(activeRubrique));

  function renderSidebarTree(catKey: string) {
    const cats = SUBCATEGORIES[catKey as keyof typeof SUBCATEGORIES];
    if (!cats) return null;

    function rubriqueRow(t: { key: string; label: string; emoji: string }) {
      const isSelected = activeThemes.has(t.key);
      const locked = PREMIUM_RUBRIQUE_KEYS.has(t.key);
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
              {t.emoji} {t.label} {locked && <span aria-hidden>🔒</span>}
            </span>
            <span className="text-[11px] font-bold opacity-60 shrink-0">{themeCounts[t.key] || 0}</span>
          </button>
        </div>
      );
    }
    const expanded = expandedInSidebar.has(catKey);
    const visibleEntries = expanded ? cats : cats.slice(0, SIDEBAR_VISIBLE_RUBRIQUES);
    const hiddenCount = cats.length - visibleEntries.length;

    return (
      <div className="pb-1.5">
        {visibleEntries.map((entry) => (
          <div key={entry.key}>{rubriqueRow(entry)}</div>
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => toggleSidebarExpand(catKey)}
            className="w-full text-left pl-6 pr-2 py-1.5 text-[12.5px] font-semibold text-primary-deep hover:underline"
          >
            + {hiddenCount} autres rubriques
          </button>
        )}
        {expanded && cats.length > SIDEBAR_VISIBLE_RUBRIQUES && (
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
                  {PREMIUM_CATEGORY_KEYS.has(c.key) && <span aria-hidden>🔒</span>}
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
  // Accueil / Sélections / Ajouter (bouton central relevé) / Listes / Profil.
  // « Explorer » et « Carte » ont été retirés : la recherche et les catégories
  // sont déjà en permanence sur l'accueil, et la carte reste accessible via le
  // bandeau « Voir la carte » et le bouton liste/carte des résultats.
  const activeTab: "accueil" | "favoris" | "listes" | "profil" | "autre" = homeMode === "favoris"
    ? "favoris"
    : homeMode === "listes"
      ? "listes"
      : homeMode === "profil"
        ? "profil"
        : showHome && homeMode === "menu"
          ? "accueil"
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
            setActive("all");
            setActiveThemes(new Set());
            setActiveZone(null);
            setQuery("");
            setBrowseAll(false);
            setHomeCategory(null);
            setHomeMode("favoris");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Mes sélections"
          aria-pressed={activeTab === "favoris"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "favoris" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <Heart size={22} weight={activeTab === "favoris" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Sélections</span>
        </button>
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              setBrowseAll(false);
              setHomeCategory(null);
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
            setActive("all");
            setActiveThemes(new Set());
            setBrowseAll(false);
            setHomeCategory(null);
            setHomeMode("listes");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-label="Listes de Koté Moris"
          aria-pressed={activeTab === "listes"}
          className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
            activeTab === "listes" ? "text-on-band" : "text-on-band/60"
          }`}
        >
          <Star size={22} weight={activeTab === "listes" ? "fill" : "regular"} aria-hidden />
          <span className="text-[10.5px] font-semibold leading-none">Listes</span>
        </button>
        <button
          onClick={() => {
            setBrowseAll(false);
            setHomeCategory(null);
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

  // Barre de filtres générique : un menu déroulant par groupe de filtre
  // applicable à la rubrique active (cf. FILTER_GROUPS), plus Prix et Sélection.
  const groupOptionsList: { group: FilterGroup; options: DropdownOption[] }[] = applicableFilterGroups
    .map((g) => {
      const options: DropdownOption[] = g.options
        .filter((o) => (facetCounts.perGroup[g.key]?.[o.key] || 0) > 0)
        .map((o) => {
          const I = iconForKey(o.key);
          return {
            key: o.key,
            label: o.label,
            count: facetCounts.perGroup[g.key][o.key],
            icon: I ? <I size={14} weight="bold" aria-hidden /> : <span aria-hidden>{o.emoji}</span>,
          };
        });
      return { group: g, options };
    })
    .filter((g) => g.options.length > 0);

  const priceOptions: DropdownOption[] = activeRubrique === "restaurants"
    ? PRICE_RANGES.filter(
        (p) => (facetCounts.price[p.key] || 0) > 0
      ).map((p) => ({ key: p.key, label: `${p.symbol} ${p.label}`, count: facetCounts.price[p.key] }))
    : [];

  const badgeOptions: DropdownOption[] = BADGE_META.filter(
    (m) => (facetCounts.badge[m.key] || 0) > 0
  ).map((m) => ({
    key: m.key,
    label: m.label,
    count: facetCounts.badge[m.key],
    icon: <span aria-hidden>{m.emoji}</span>,
  }));

  const hasFacets = groupOptionsList.length > 0 || priceOptions.length > 0 || badgeOptions.length > 0;
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
      {groupOptionsList.map(({ group, options }) => (
        <FilterDropdown
          key={group.key}
          label={group.label}
          options={options}
          selected={facetGroups[group.key] ?? new Set()}
          onToggle={(k) => toggleFacetGroup(group.key, k)}
          onClear={() => clearFacetGroup(group.key)}
        />
      ))}
      {priceOptions.length > 0 && (
        <FilterDropdown
          label="Prix"
          options={priceOptions}
          selected={facetPrices}
          onToggle={(k) => toggleInSet(setFacetPrices, k)}
          onClear={() => setFacetPrices(new Set())}
        />
      )}
      {facetActive && (
        <button
          onClick={resetFacets}
          className="shrink-0 text-[12.5px] font-semibold text-primary-deep hover:underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="app min-h-screen flex flex-col">
      {/* En-tête « Lagon » : bandeau clair poulpe, logo clair + recherche.
          Le décor de nature mauricienne (montagne, lagon) est déjà intégré
          à l'image du bandeau clair (cf. Logo light) ; ailleurs le header
          reste blanc et compact pour bien séparer le contenu qui défile
          en dessous. */}
      <header
        className={`relative z-30 overflow-hidden ${
          showHome && homeMode === "menu"
            ? "bg-bg border-b border-transparent"
            : "bg-surface border-b border-border shadow-sm"
        }`}
      >
        {showHome && homeMode === "menu" ? (
          <div className="relative pb-3">
            <button
              onClick={goHome}
              aria-label="Retour à l'accueil"
              className="block w-full aspect-[864/281] hover:opacity-90 active:scale-[.98] transition"
            >
              <Logo light />
            </button>
          </div>
        ) : (
          <button
            onClick={goHome}
            aria-label="Retour à l'accueil"
            className="block relative w-full aspect-[864/281] hover:opacity-90 active:scale-[.98] transition"
          >
            <Logo light />
          </button>
        )}
        {showHeaderSearch && (
          <div className="relative max-w-[1400px] mx-auto px-5 pb-2.5">
            <div className="max-w-[640px]">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher une activité, un lieu, un nom…"
              />
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto lg:flex min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-[270px] shrink-0 border-r border-border overflow-y-auto sticky top-0 max-h-[calc(100vh)]">
          {sidebarContent}
        </aside>

        <div className="flex-1 min-w-0 px-4 lg:px-5 py-3 pb-24">
          {/* Accueil : barre de recherche (point d'entrée vers le mode
              recherche/résultats), rangée de catégories, coups de cœur de la
              rédaction et bandeau carte — inspiré du rendu fourni par la
              cliente. Remplace l'ancien menu à 4 tuiles (la tuile « Recherche »
              a été retirée : la recherche vit désormais ici en permanence). */}
          {showHome && homeMode === "menu" && (
            <div className="max-w-[720px] mx-auto pb-6">
              <button
                onClick={() => { setBrowseAll(true); setTimeout(focusSearch, 60); }}
                className="relative w-full h-[46px] mb-6 rounded-pill border border-border bg-surface shadow-sm text-left pl-11 pr-4 text-[15px] text-muted active:scale-[.99] transition-transform"
              >
                <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">🔍</span>
                Rechercher une adresse, une activité…
              </button>

              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[16px] font-bold text-ink">Explorer par catégorie</h2>
                <button
                  onClick={() => setHomeMode("categories")}
                  className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  Voir tout ›
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORIES.filter((c) => (counts[c.key] || 0) > 0).map((c) => {
                  const mascot = mascotFor(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => { setHomeMode("categories"); setHomeCategory(c.key); }}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-[84px] active:scale-[.96] transition-transform"
                    >
                      <span
                        className="w-[76px] h-[76px] rounded-full overflow-hidden shadow-sm flex items-center justify-center text-2xl"
                        style={{ background: categoryTint(c.key) }}
                      >
                        {mascot ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mascot} alt="" className="w-full h-full object-contain" />
                        ) : (
                          c.emoji
                        )}
                      </span>
                      <span className="text-[11.5px] font-semibold text-ink text-center leading-tight">
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {coupsDeCoeur.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-7 mb-2.5">
                    <h2 className="text-[16px] font-bold text-ink">Les coups de cœur de Koté Moris</h2>
                    <button
                      onClick={() => { setBrowseAll(true); setFacetBadges(new Set(["selection"])); }}
                      className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                    >
                      Voir tout ›
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {coupsDeCoeur.slice(0, 12).map((b) => (
                      <div
                        key={b.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectFromCard(b.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectFromCard(b.id); }}
                        className="relative shrink-0 w-[160px] rounded-card overflow-hidden bg-surface border border-border shadow-card text-left cursor-pointer active:scale-[.98] transition-transform"
                      >
                        <div className="relative h-[110px] bg-primary-tint flex items-center justify-center">
                          {b.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            (() => {
                              const FallbackIcon = iconForKey(b.category);
                              return FallbackIcon ? (
                                <FallbackIcon size={30} weight="duotone" className="text-primary-deep opacity-50" aria-hidden />
                              ) : null;
                            })()
                          )}
                          <span
                            className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-surface/90 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton id={b.id} size={12.5} />
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[13px] font-bold text-ink truncate">{displayName(b.name)}</p>
                          <p className="text-[11.5px] text-muted truncate">
                            {CATEGORY_MAP[b.category].label} • {displayCity(b.address)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-7 rounded-2xl p-4" style={{ background: "var(--primary-tint)" }}>
                <p className="text-[13px] font-semibold text-ink text-center mb-3.5">
                  Découvrez nos meilleures adresses
                </p>
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={() => {
                      setNearMe(false);
                      setBrowseAll(true);
                      setHomeCategory(null);
                      setFacetBadges(new Set(["selection"]));
                      setResultsView("liste");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex flex-col items-center gap-1.5 active:scale-[.96] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/badge-selection.png" alt="" aria-hidden className="h-16 w-16" />
                    <span className="text-[12px] font-semibold text-ink text-center leading-tight">
                      Sélection Koté Moris
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setNearMe(false);
                      setBrowseAll(true);
                      setHomeCategory(null);
                      setActiveThemes(new Set(["kids-friendly"]));
                      setResultsView("liste");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex flex-col items-center gap-1.5 active:scale-[.96] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/badge-kids.png" alt="" aria-hidden className="h-16 w-16" />
                    <span className="text-[12px] font-semibold text-ink text-center leading-tight">
                      Kids friendly
                    </span>
                  </button>
                </div>
                <p className="text-center text-[12.5px] font-bold text-primary-deep mt-3.5">
                  Voir les adresses ›
                </p>
              </div>

              <div className="flex items-center justify-between mt-7 mb-2.5">
                <h2 className="text-[16px] font-bold text-ink">Les listes de Koté Moris</h2>
                <button
                  onClick={() => setHomeMode("listes")}
                  className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  Voir tout ›
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {SELECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setHomeMode("listes"); setSelectedListId(s.id); }}
                    className="relative text-left shrink-0 w-[130px] aspect-[4/5] rounded-2xl overflow-hidden shadow-card active:scale-[.98] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photoUrl}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                    />
                    <span className="absolute inset-x-0 bottom-0 p-2.5">
                      <span className="block font-serif text-[12px] font-semibold leading-tight text-white line-clamp-2">
                        {s.title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accueil → Par catégorie : grille des 8 catégories (un seul niveau
              de profondeur) — clic sur une catégorie → liste plate de ses
              rubriques ; clic sur une rubrique → résultats. */}
          {showHome && homeMode === "categories" && homeCategory === null && (
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
              <div className="flex flex-col gap-2 sm:max-w-[560px]">
                {CATEGORIES.filter((c) => (counts[c.key] || 0) > 0).map((c) => (
                  <CategoryRow
                    key={c.key}
                    category={c.key}
                    count={counts[c.key] || 0}
                    locked={PREMIUM_CATEGORY_KEYS.has(c.key)}
                    onClick={() => setHomeCategory(c.key)}
                  />
                ))}
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
                        locked={PREMIUM_RUBRIQUE_KEYS.has(t.key)}
                        onClick={() => openRubrique(t.key)}
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
                  <Heart size={16} weight="duotone" aria-hidden /> Mes sélections
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

          {/* Accueil → Par catégorie → une catégorie choisie : liste plate de
              ses rubriques (SUBCATEGORIES[cat]), un seul clic vers les résultats. */}
          {showHome && homeMode === "categories" && homeCategory !== null && homeSubRubrique === null && (
            <div className="pb-16">
              <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                <button
                  onClick={() => setHomeCategory(null)}
                  aria-label="Retour"
                  className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                >
                  <ArrowLeft size={17} weight="bold" aria-hidden />
                </button>
                <p className="text-[15px] font-semibold truncate">{CATEGORY_MAP[homeCategory].label}</p>
              </div>
              <div className="h-2.5" />
              <div className="flex flex-col gap-2 sm:max-w-[560px] sm:mx-auto">
                {(SUBCATEGORIES[homeCategory] ?? [])
                  .filter((s) => (themeCountsAll[s.key] || 0) > 0)
                  .map((s) => (
                    <CategoryRow
                      key={s.key}
                      iconKey={s.key}
                      emoji={s.emoji}
                      label={s.label}
                      count={themeCountsAll[s.key] || 0}
                      locked={PREMIUM_RUBRIQUE_KEYS.has(s.key)}
                      onClick={() => openRubrique(s.key)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Accueil → Par catégorie → rubrique → sous-rubriques (cf.
              FILTER_GROUPS[].browsable) : dernier niveau avant les résultats,
              restauré après avoir été perdu dans la refonte du 17/08/2026. */}
          {showHome && homeMode === "categories" && homeSubRubrique !== null && (() => {
            const group = browsableGroupFor(homeSubRubrique);
            if (!group) return null;
            const rubriqueLabel = RUBRIQUE_MAP[homeSubRubrique]?.label ?? homeSubRubrique;
            return (
              <div className="pb-16">
                <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                  <button
                    onClick={() => setHomeSubRubrique(null)}
                    aria-label="Retour"
                    className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                  >
                    <ArrowLeft size={17} weight="bold" aria-hidden />
                  </button>
                  <p className="text-[15px] font-semibold truncate">{rubriqueLabel}</p>
                </div>
                <div className="h-2.5" />
                <div className="flex flex-col gap-2 sm:max-w-[560px] sm:mx-auto">
                  {group.options
                    .filter((o) => (subRubriqueCounts[o.key] || 0) > 0)
                    .map((o) => (
                      <CategoryRow
                        key={o.key}
                        iconKey={o.key}
                        emoji={o.emoji}
                        label={o.label}
                        count={subRubriqueCounts[o.key] || 0}
                        onClick={() => selectSubRubrique(homeSubRubrique, group, o.key)}
                      />
                    ))}
                </div>
              </div>
            );
          })()}

          {/* Accueil → Mes favoris : fiches enregistrées via le cœur (favori + à tester), stockage local. */}
          {showHome && homeMode === "favoris" && (
            <div className="pb-16">
              {favoriteBusinesses.length === 0 && aTesterBusinesses.length === 0 && testeBusinesses.length === 0 ? (
                <div className="mt-6 max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 flex flex-col items-center gap-3">
                  <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
                    <Heart size={28} weight="duotone" aria-hidden />
                  </span>
                  <p className="font-serif text-lg font-semibold leading-tight">Pas encore de favoris</p>
                  <p className="text-[13px] text-muted leading-snug">
                    Touchez le cœur (coup de cœur), le drapeau (à tester) ou le check (testé) sur une fiche pour l&apos;enregistrer ici.
                  </p>
                </div>
              ) : (
                <div className="max-w-[560px] mx-auto flex flex-col gap-5 pt-1">
                  {/* Accès direct : passe d'une liste à l'autre sans avoir à scroller. */}
                  <div className="flex items-center gap-2 flex-wrap sticky top-0 z-10 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 bg-bg">
                    <button
                      onClick={() => favorisSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={favoriteBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: `color-mix(in srgb, ${COUP_DE_COEUR_COLOR} 12%, var(--surface))`, color: COUP_DE_COEUR_COLOR }}
                    >
                      <Heart size={14} weight="fill" aria-hidden /> Favoris ({favoriteBusinesses.length})
                    </button>
                    <button
                      onClick={() => aTesterSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={aTesterBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: "color-mix(in srgb, #f5a623 12%, var(--surface))", color: "#f5a623" }}
                    >
                      <Flag size={14} weight="fill" aria-hidden /> À tester ({aTesterBusinesses.length})
                    </button>
                    <button
                      onClick={() => testeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={testeBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: "color-mix(in srgb, #2e9e5b 12%, var(--surface))", color: "#2e9e5b" }}
                    >
                      <CheckCircle size={14} weight="fill" aria-hidden /> Testé ({testeBusinesses.length})
                    </button>
                    <button
                      onClick={() => setFavorisMapOpen((v) => !v)}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold active:scale-[.97] transition-transform border border-border"
                      style={
                        favorisMapOpen
                          ? { background: "var(--primary)", color: "var(--on-primary, #fff)" }
                          : { background: "var(--surface)", color: "var(--ink)" }
                      }
                    >
                      <MapPin size={14} weight={favorisMapOpen ? "fill" : "regular"} aria-hidden />
                      {favorisMapOpen ? "Voir la liste" : "Sur la carte"}
                    </button>
                  </div>
                  {favorisMapOpen ? (
                    <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden h-[65vh]">
                      <Map
                        businesses={favorisMapBusinesses}
                        selectedId={selectedId}
                        onSelect={selectFromCard}
                        onBoundsChange={() => {}}
                        fitKey={`favoris|${favorisMapBusinesses.map((b) => b.id).join(",")}`}
                        hoveredId={hoveredId}
                        onHover={setHoveredId}
                        userPos={userPos}
                      />
                    </div>
                  ) : (
                  <>
                  {favoriteBusinesses.length > 0 && (
                    <div ref={favorisSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] text-muted">
                        {favoriteBusinesses.length} coup{favoriteBusinesses.length > 1 ? "s" : ""} de cœur
                      </p>
                      {favoriteBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  {aTesterBusinesses.length > 0 && (
                    <div ref={aTesterSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] font-bold" style={{ color: "#f5a623" }}>
                        À tester ({aTesterBusinesses.length})
                      </p>
                      {aTesterBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  {testeBusinesses.length > 0 && (
                    <div ref={testeSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] font-bold" style={{ color: "#2e9e5b" }}>
                        Testé ({testeBusinesses.length})
                      </p>
                      {testeBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Accueil → Listes de Koté Moris : sélections éditoriales par thématique. */}
          {showHome && homeMode === "listes" && selectedListId === null && (
            <div className="pb-16 max-w-[900px] mx-auto">
              <div className="mb-5 text-center">
                <h2 className="font-serif text-xl font-semibold leading-tight">Nos sélections</h2>
                <p className="m-0 mt-1 text-[13px] text-muted leading-snug">
                  Nos coups de cœur pour vivre Maurice autrement.
                </p>
              </div>

              {highlightSelections.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
                  {highlightSelections.map((s) => {
                    const SIcon = SELECTION_ICONS[s.icon];
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedListId(s.id)}
                        className="relative text-left rounded-2xl overflow-hidden aspect-[4/5] shadow-card active:scale-[.98] transition-transform"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.photoUrl}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                        />
                        <span
                          className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ background: "var(--primary, #087e8b)" }}
                        >
                          <SIcon size={17} weight="fill" aria-hidden />
                        </span>
                        <span className="absolute inset-x-0 bottom-0 p-3">
                          <span className="block font-serif text-[13.5px] font-semibold leading-tight text-white">
                            {s.title}
                          </span>
                          <span className="block text-[11px] text-white/80 mt-0.5">
                            {s.businessIds.length} adresses
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <h3 className="text-[15px] font-bold text-ink mb-2.5">Explorer toutes nos sélections</h3>
              <div className="flex items-center gap-2 mb-3.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectionExploreFilter("tous")}
                  className={`shrink-0 px-3.5 py-1.5 rounded-pill text-[12.5px] font-bold transition-colors ${
                    selectionExploreFilter === "tous" ? "text-on-accent" : "text-ink"
                  }`}
                  style={{ background: selectionExploreFilter === "tous" ? "var(--primary, #087e8b)" : "var(--surface-2, #ececef)" }}
                >
                  Tous
                </button>
                {(Object.keys(SELECTION_GROUP_META) as SelectionGroup[]).map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectionExploreFilter(group)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-pill text-[12.5px] font-bold transition-colors ${
                      selectionExploreFilter === group ? "text-on-accent" : "text-ink"
                    }`}
                    style={{ background: selectionExploreFilter === group ? "var(--primary, #087e8b)" : "var(--surface-2, #ececef)" }}
                  >
                    {SELECTION_GROUP_META[group].label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {exploreSelections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedListId(s.id)}
                    className="text-left bg-surface border border-border rounded-2xl overflow-hidden shadow-sm active:scale-[.98] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photoUrl}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="w-full h-24 object-cover"
                    />
                    <span className="block p-2.5">
                      <span className="block font-serif text-[12.5px] font-semibold leading-tight line-clamp-2">
                        {s.title}
                      </span>
                      <span className="block text-[11px] text-muted mt-1">{s.businessIds.length} adresses</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accueil → Listes de Koté Moris → une sélection ouverte : ses fiches. */}
          {showHome && homeMode === "listes" && selectedList && (
            <div className="pb-16">
              <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                <button
                  onClick={() => setSelectedListId(null)}
                  aria-label="Retour aux sélections"
                  className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                >
                  <ArrowLeft size={17} weight="bold" aria-hidden />
                </button>
                <p className="text-[15px] font-semibold truncate">
                  <span aria-hidden>{selectedList.emoji}</span> {selectedList.title}
                </p>
              </div>
              <div className="max-w-[560px] mx-auto pt-3">
                <p className="m-0 mb-3 text-[13px] text-muted leading-snug">
                  Notre sélection Koté Moris · {selectedListBusinesses.length} adresses — {selectedList.tagline}
                </p>
                <div className="flex flex-col gap-3">
                  {selectedListBusinesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      active={b.id === selectedId}
                      onSelect={selectFromCard}
                      onHover={() => {}}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accueil → Ajouter une adresse : formulaire de suggestion. */}
          {showHome && homeMode === "ajouter" && (
            <div className="pb-16">
              <AddAddressForm />
            </div>
          )}

          {/* Accueil → Profil : pas de compte utilisateur pour l'instant
              (favoris/sélections stockés en local) — écran d'attente. */}
          {showHome && homeMode === "profil" && (
            <div className="pb-16 pt-6 max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 flex flex-col items-center gap-3">
              <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
                <UserCircle size={30} weight="duotone" aria-hidden />
              </span>
              <p className="font-serif text-lg font-semibold leading-tight">Bientôt disponible</p>
              <p className="text-[13px] text-muted leading-snug">
                Le compte Koté Moris arrive prochainement. En attendant, vos favoris et vos
                adresses testées sont enregistrés sur cet appareil, dans « Sélections ».
              </p>
            </div>
          )}

          {/* Barre de résultats : retour + « Autour de moi » / zone + bascule
              liste/carte, tenue sur une seule ligne (bande réduite) pour
              laisser plus de place aux fiches en dessous. */}
          <div className={`sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 items-center gap-2 py-1.5 border-b border-border mb-3 ${mobileTiles ? "hidden" : "flex"}`} style={{ background: "var(--bg)" }}>
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
            <button
              onClick={() => {
                if (resultsView === "carte") {
                  setResultsView("liste");
                } else {
                  setResultsView("carte");
                  requestUserPosSilently();
                }
              }}
              aria-pressed={resultsView === "carte"}
              title={resultsView === "carte" ? "Voir la liste" : "Voir la carte"}
              className={`lg:hidden shrink-0 ml-auto order-last inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                resultsView === "carte" ? "bg-primary text-white" : "bg-surface-2 text-ink"
              }`}
            >
              <MapPin size={14} weight={resultsView === "carte" ? "fill" : "regular"} aria-hidden />
              {resultsView === "carte" ? "Carte" : "Liste"}
            </button>
            {zoneControls}
          </div>

          {/* Catégories — accessibles en mobile dans les résultats/la carte,
              uniquement en recherche/« voir tout » (browseAll) : quand on
              arrive par Explorer par catégorie, on est déjà dans une seule
              catégorie donc la rangée n'a plus de sens (sidebar desktop only). */}
          {!mobileTiles && browseAll && (
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 mb-3 -mt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => selectCategoryChip("all")}
                className={`shrink-0 px-3 py-1.5 rounded-pill text-[12.5px] font-semibold transition-colors ${
                  active === "all" ? "bg-primary text-white" : "bg-surface-2 text-ink"
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.filter((c) => (counts[c.key] || 0) > 0).map((c) => {
                const CIcon = iconForKey(c.key);
                const isActive = active === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => selectCategoryChip(c.key)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-semibold transition-colors ${
                      isActive ? "text-white" : "bg-surface-2 text-ink"
                    }`}
                    style={isActive ? { background: c.color } : undefined}
                  >
                    {CIcon ? <CIcon size={13} weight={isActive ? "fill" : "regular"} aria-hidden /> : <span aria-hidden>{c.emoji}</span>}
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {geoStatus === "denied" && nearMe === false && (
            <p className="mb-3 text-[12.5px] text-muted">
              📍 Position refusée. Autorisez la localisation dans votre navigateur pour trier par distance.
            </p>
          )}
          {geoStatus === "unavailable" && (
            <p className="mb-3 text-[12.5px] text-muted">📍 Géolocalisation indisponible sur cet appareil.</p>
          )}

          {activeCategoryLocked ? (
            <div className="max-w-[300px] w-full mx-auto mt-8 text-center bg-surface/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 flex flex-col items-center gap-2" style={{ border: "2px solid var(--accent)" }}>
              <span className="text-3xl" aria-hidden>🔒</span>
              <p className="font-serif text-lg font-semibold leading-tight">Réservé aux membres Premium</p>
              <p className="text-[13px] text-muted leading-snug">
                Débloquez « {breadcrumb.label} » et tout le contenu Premium de Koté Moris.
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
          ) : (
            <>
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
                    userPos={userPos}
                  />
                </div>
              </div>
            </div>
          </div>
            </>
          )}
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
