"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, PRICE_RANGES, FAMILIES } from "@/data/categories";
import { trackEvent } from "@/lib/track";

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

function tel(phone: string) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

// Corrige les noms saisis TOUT EN MAJUSCULES : ne touche que les mots
// entièrement en capitales, laisse les noms déjà bien casés intacts.
function displayName(name: string): string {
  return name.replace(/\p{L}+/gu, (word) => {
    if (word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });
}

// N'affiche que la ville : dernier segment de l'adresse, sans coordonnées
// GPS ni code postal.
function displayCity(address: string): string {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !/^-?\d{1,3}\.\d+$/.test(s));
  const last = parts[parts.length - 1] || address;
  return last.replace(/\s+\d{4,6}$/, "").trim();
}

function webLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function whatsappLink(phone: string) {
  return "https://wa.me/" + phone.replace(/[^\d]/g, "");
}

// Les numéros mobiles mauriciens (+230 5xxx xxxx) sont presque toujours
// joignables sur WhatsApp, contrairement aux lignes fixes.
const MU_MOBILE_RE = /\+230\s?5\d{3}\s?\d{4}/;

function whatsappNumber(b: Business): string | undefined {
  if (b.whatsapp) return b.whatsapp;
  if (b.phone && MU_MOBILE_RE.test(b.phone)) return b.phone;
  return undefined;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: "Débutant",
  habitue: "Habitué",
  confirme: "Confirmé",
};

const AGENCY_COLOR = "#6366f1";
const COUP_DE_COEUR_COLOR = "#ff2d6a";
const SELECTION_COLOR = "#7c3aed";

function badgeAccentColor(badge?: Business["badge"]): string | undefined {
  if (badge === "coup-de-coeur") return COUP_DE_COEUR_COLOR;
  if (badge === "selection") return SELECTION_COLOR;
  if (badge === "partenaire") return "var(--accent)";
  return undefined;
}

function metaFacts(b: Business): { icon: string; label: string }[] {
  const facts: { icon: string; label: string }[] = [];
  if (b.distance) facts.push({ icon: "📏", label: b.distance });
  if (b.elevationGain) facts.push({ icon: "⛰️", label: b.elevationGain });
  if (b.duration) facts.push({ icon: "⏱️", label: b.duration });
  if (b.entryPrice) facts.push({ icon: "🎟️", label: b.entryPrice });
  if (b.difficultyLevel) facts.push({ icon: "🥾", label: DIFFICULTY_LABELS[b.difficultyLevel] });
  if (b.guideRecommended !== undefined && !b.isAgency)
    facts.push({ icon: "🧭", label: b.guideRecommended ? "Guide conseillé" : "Sans guide" });
  if (b.sportsListed) facts.push({ icon: "🏃", label: b.sportsListed });
  if (b.hasRestauration !== undefined)
    facts.push({ icon: "🍽️", label: b.hasRestauration ? "Restauration sur place" : "Pas de restauration" });
  if (b.ttvFriendly) facts.push({ icon: "💻", label: "Adapté télétravail" });
  if (b.kidsActivities) facts.push({ icon: "🧒", label: "Activités enfants" });
  if (b.sandType) facts.push({ icon: "🏖️", label: b.sandType });
  if (b.beachActivities) facts.push({ icon: "🎯", label: b.beachActivities });
  if (b.beachLength) facts.push({ icon: "📏", label: b.beachLength });
  if (b.animalsVisible) facts.push({ icon: "🦁", label: b.animalsVisible });
  if (b.golfHoles) facts.push({ icon: "⛳", label: `${b.golfHoles} trous${b.golfPar ? ` par ${b.golfPar}` : ""}${b.golfLength ? `, ${b.golfLength}` : ""}` });
  if (b.golfDesigner) facts.push({ icon: "✏️", label: b.golfDesigner });
  if (b.golfPricing) facts.push({ icon: "💰", label: b.golfPricing });
  return facts;
}

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

  function selectCategory(key: string) {
    setActive(key);
    setActiveThemes(new Set());
    setSidebarOpen(false);
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
    allEntries.push({ key: UNCLASSIFIED, row: { key: UNCLASSIFIED, label: "Non classé", emoji: "❔" } });

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
        <div className="max-w-[1400px] mx-auto px-5 h-[56px] flex items-center gap-2 font-bold text-lg tracking-tight">
          <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]" />
          Maurice<sup className="text-accent">+</sup>
        </div>
      </header>

      <div className="border-b border-border bg-bg/90 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 py-3.5 flex flex-col gap-3">
          <div className="relative max-w-[640px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une activité, un lieu, un nom…"
              aria-label="Rechercher"
              autoComplete="off"
              className="w-full h-[46px] pl-11 pr-4 rounded-full border border-border bg-surface text-ink text-base shadow-[0_1px_2px_rgba(13,43,42,.05)] focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-muted">📍 Zone :</span>
            <button
              onClick={() => setActiveZone(null)}
              aria-pressed={activeZone === null}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeZone === null
                  ? "bg-primary border-primary text-white"
                  : "bg-surface border-border text-ink hover:border-primary"
              }`}
            >
              📍 Toute l&apos;île
            </button>
            {ZONES.map((z) => (
              <button
                key={z.key}
                onClick={() => toggleZone(z.key)}
                aria-pressed={activeZone === z.key}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${
                  activeZone === z.key
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-border text-ink hover:border-primary"
                }`}
              >
                {z.emoji} {z.label}
                <span className="text-[11px] font-bold opacity-70">{zoneCounts[z.key] || 0}</span>
              </button>
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
            <div className="relative w-[85%] max-w-[320px] h-full bg-surface overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
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
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 px-4 lg:px-5 py-3">
          {/* Barre de résultats */}
          <div className="flex items-center justify-between gap-3 flex-wrap py-2 border-b border-border mb-3">
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

          <div className="lg:flex lg:gap-4 lg:h-[calc(100vh-190px)]">
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
                  {visibleRows.map((b) => {
                    const cat = CATEGORY_MAP[b.category];
                    const isActive = b.id === selectedId || b.id === hoveredId;
                    const accentColor = badgeAccentColor(b.badge) ?? (b.isAgency ? AGENCY_COLOR : undefined);
                    const waNumber = whatsappNumber(b);
                    return (
                      <article
                        key={b.id}
                        ref={(el) => {
                          cardRefs.current[b.id] = el;
                        }}
                        onClick={() => selectFromCard(b.id)}
                        onMouseEnter={() => setHoveredId(b.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`bg-surface border rounded-2xl p-4 shadow-[0_1px_2px_rgba(13,43,42,.05),0_12px_30px_-14px_rgba(13,43,42,.28)] flex gap-3.5 cursor-pointer transition-colors ${
                          isActive ? "border-accent" : "border-border"
                        }`}
                        style={
                          accentColor
                            ? {
                                borderLeftColor: accentColor,
                                borderLeftWidth: 4,
                                backgroundColor: `color-mix(in srgb, ${accentColor} 6%, var(--surface))`,
                              }
                            : undefined
                        }
                      >
                        {b.photoUrl && (
                          <div className="shrink-0 w-[76px] h-[76px] rounded-xl overflow-hidden bg-surface-2 relative">
                            <img
                              src={b.photoUrl}
                              alt={displayName(b.name)}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            {b.photoCredit && (
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] leading-none text-white/90 bg-black/40">
                                {b.photoCredit}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-bold"
                              style={{ background: cat.color }}
                            >
                              {cat.emoji} {cat.label}
                            </span>
                            {b.badge === "partenaire" && (
                              <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold bg-accent">
                                ⭐ Partenaire
                              </span>
                            )}
                            {b.badge === "coup-de-coeur" && (
                              <span
                                className="self-start inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-sm font-extrabold tracking-tight shadow-[0_2px_10px_-2px_rgba(255,45,106,.65)]"
                                style={{ background: COUP_DE_COEUR_COLOR }}
                              >
                                💛 Coup de cœur
                              </span>
                            )}
                            {b.badge === "selection" && (
                              <span
                                className="self-start inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-sm font-extrabold tracking-tight shadow-[0_2px_10px_-2px_rgba(124,58,237,.65)]"
                                style={{ background: SELECTION_COLOR }}
                              >
                                🏅 Sélection Maurice<sup>+</sup>
                              </span>
                            )}
                            {b.isAgency && (
                              <span
                                className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold"
                                style={{ background: AGENCY_COLOR }}
                              >
                                🏢 Agence organisatrice
                              </span>
                            )}
                            {b.themes?.map((tKey) => {
                              const theme = SUBCATEGORIES[b.category]?.find((t) => t.key === tKey);
                              return theme ? (
                                <span
                                  key={tKey}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-surface-2 text-muted"
                                >
                                  {theme.emoji} {theme.label}
                                </span>
                              ) : null;
                            })}
                            {b.priceRange &&
                              (() => {
                                const price = PRICE_RANGES.find((p) => p.key === b.priceRange);
                                return price ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-surface-2 text-muted">
                                    {price.symbol} {price.label}
                                  </span>
                                ) : null;
                              })()}
                            {b.takeaway && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-surface-2 text-muted">
                                🥡 À emporter
                              </span>
                            )}
                          </div>
                          <h3 className="m-0 text-[16px] leading-[1.25] tracking-tight">{displayName(b.name)}</h3>
                          <p className="m-0 text-muted text-[13px] leading-[1.5]">📍 {displayCity(b.address)}</p>
                          {b.description && (
                            <p className="m-0 text-ink text-[13px] leading-[1.5] -mt-1">{b.description}</p>
                          )}
                          {b.hours && (
                            <p className="m-0 text-muted text-[12.5px] leading-[1.4] -mt-1">🕒 {b.hours}</p>
                          )}
                          {metaFacts(b).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 -mt-1">
                              {metaFacts(b).map((f, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-border bg-surface-2 text-muted"
                                >
                                  {f.icon} {f.label}
                                </span>
                              ))}
                            </div>
                          )}
                          {b.promoText && (
                            <p className="m-0 text-[13px] leading-[1.45] text-primary-deep border-l-2 border-primary pl-2.5 py-0.5">
                              💬 <span className="italic">{b.promoText}</span>
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {!b.themes?.includes("plages") &&
                              (b.phone ? (
                                <a
                                  href={tel(b.phone)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    trackEvent(b.id, "call");
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold no-underline bg-primary border border-primary text-white"
                                >
                                  📞 Appeler
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold bg-surface-2 border border-border text-ink opacity-45">
                                  📞 Sans tél.
                                </span>
                              ))}
                            {b.email && (
                              <a
                                href={`mailto:${b.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
                              >
                                ✉️ Email
                              </a>
                            )}
                            {waNumber && (
                              <a
                                href={whatsappLink(waNumber)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  trackEvent(b.id, "whatsapp");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
                              >
                                💬 WhatsApp
                              </a>
                            )}
                            {b.website && (
                              <a
                                href={b.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  trackEvent(b.id, "website");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
                              >
                                🌐 {webLabel(b.website)}
                              </a>
                            )}
                            {b.googleMapsUrl && (
                              <a
                                href={b.googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  trackEvent(b.id, "directions");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
                              >
                                📍 Itinéraire
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Carte */}
            <div
              className={`lg:w-[44%] lg:h-full mt-3 lg:mt-0 ${
                resultsView === "liste" ? "hidden lg:block" : ""
              }`}
            >
              <div className="rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(13,43,42,.05),0_12px_30px_-14px_rgba(13,43,42,.28)] overflow-hidden h-[60vh] lg:h-full flex flex-col">
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
