"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, FAMILIES } from "@/data/categories";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterChip } from "@/components/ui/FilterChip";
import { CategoryTile } from "@/components/ui/CategoryTile";
import { BusinessCard } from "@/components/ui/BusinessCard";

const UNCLASSIFIED = "__unclassified__";
const SIDEBAR_VISIBLE_RUBRIQUES = 5;

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
  const [expandedInSidebar, setExpandedInSidebar] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resultsView, setResultsView] = useState<"liste" | "carte">("liste");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Mobile : forcer la liste à plat malgré l'écran d'accueil par catégories.
  const [browseAll, setBrowseAll] = useState(false);
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

  // Retour à l'écran d'accueil : réinitialise tous les filtres.
  function goHome() {
    setActive("all");
    setActiveThemes(new Set());
    setActiveZone(null);
    setQuery("");
    setBrowseAll(false);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectCategory(key: string) {
    setActive(key);
    setActiveThemes(new Set());
    setBrowseAll(false);
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

  // Comptes par catégorie pour l'écran d'accueil mobile (tiennent compte de la zone).
  const homeCategoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (activeZone && b.zone !== activeZone) return;
      c[b.category] = (c[b.category] || 0) + 1;
    });
    return c;
  }, [businesses, activeZone]);

  const zoneCounts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (active !== "all" && b.category !== active) return;
      if (b.zone) c[b.zone] = (c[b.zone] || 0) + 1;
    });
    return c;
  }, [businesses, active]);

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
        if (!q) return true;
        return (b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label)
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0));
  }, [businesses, query, active, activeThemes, activeZone]);

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
    setSelectedId(id);
  }

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
    const theme = subcategories?.find((s) => s.key === key);
    return theme ? { key: theme.key, emoji: theme.emoji, label: theme.label } : null;
  }, [activeThemes, subcategories]);

  // Écran d'accueil mobile : on présente les catégories plutôt que 2574 résultats
  // en vrac, tant qu'aucune catégorie/thème/recherche n'est actif.
  const showHome =
    active === "all" && activeThemes.size === 0 && query.trim() === "" && !browseAll;

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

  return (
    <div className="app min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 h-[56px] flex items-center">
          <button
            onClick={goHome}
            aria-label="Retour à l'accueil"
            className="flex items-center gap-2 font-serif font-semibold text-xl tracking-tight rounded-lg -ml-1 px-1 py-1 hover:opacity-80 active:scale-[.98] transition"
          >
            <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]" />
            Maurice<sup className="text-accent">+</sup>
          </button>
        </div>
      </header>

      <div className="border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 py-3.5 flex flex-col gap-3">
          <div className="max-w-[640px]">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher une activité, un lieu, un nom…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body font-semibold text-muted shrink-0">📍 Zone :</span>
            <FilterChip active={activeZone === null} onClick={() => setActiveZone(null)}>
              📍 Toute l&apos;île
            </FilterChip>
            {ZONES.map((z) => (
              <FilterChip
                key={z.key}
                active={activeZone === z.key}
                onClick={() => toggleZone(z.key)}
              >
                {z.emoji} {z.label}
                <span className="text-meta font-bold opacity-70">{zoneCounts[z.key] || 0}</span>
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

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
          {/* Écran d'accueil mobile : catégories en tuiles */}
          {showHome && (
            <div className="lg:hidden">
              <p className="text-[13px] font-semibold text-muted mb-2.5">
                Explorez par catégorie
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.filter((c) => (homeCategoryCounts[c.key] || 0) > 0).map((c) => (
                  <CategoryTile
                    key={c.key}
                    category={c.key}
                    count={homeCategoryCounts[c.key] || 0}
                    onClick={() => selectCategory(c.key)}
                  />
                ))}
              </div>
              <button
                onClick={() => setBrowseAll(true)}
                className="w-full mt-3 mb-16 py-2.5 rounded-xl border border-border bg-surface text-[13.5px] font-semibold text-primary-deep active:scale-[.99] transition-transform"
              >
                Voir toutes les adresses ({rows.length})
              </button>
            </div>
          )}

          {/* Barre de résultats */}
          <div className={`items-center justify-between gap-3 flex-wrap py-2 border-b border-border mb-3 ${showHome ? "hidden lg:flex" : "flex"}`}>
            <div className="flex items-center gap-2 min-w-0">
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

          <div className={`lg:flex lg:gap-4 lg:h-[calc(100vh-190px)] ${showHome ? "hidden lg:flex" : ""}`}>
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

      <footer className="border-t border-border py-5 pb-10 text-muted text-[13px] leading-[1.6]">
        <div className="max-w-[1400px] mx-auto px-5">
          <b className="text-ink">Aperçu MVP</b> — sélection de {businesses.length} fiches issues
          de l&apos;import Google Places, couvrant toute l&apos;île. Les données seront enrichies
          et vérifiées avant mise en ligne. Statut, horaires et photos viendront ensuite.
        </div>
      </footer>
    </div>
  );
}
