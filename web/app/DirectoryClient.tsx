"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Business } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, PRICE_RANGES, FAMILIES } from "@/data/categories";
import { trackEvent } from "@/lib/track";

const UNCLASSIFIED = "__unclassified__";

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

function badgeAccentColor(badge?: Business["badge"]): string | undefined {
  if (badge === "coup-de-coeur") return "var(--primary)";
  if (badge === "selection") return "var(--primary-deep)";
  if (badge === "partenaire") return "var(--accent)";
  return undefined;
}

function metaFacts(b: Business): { icon: string; label: string }[] {
  const facts: { icon: string; label: string }[] = [];
  if (b.duration) facts.push({ icon: "⏱️", label: b.duration });
  if (b.entryPrice) facts.push({ icon: "🎟️", label: b.entryPrice });
  if (b.difficultyLevel) facts.push({ icon: "🥾", label: DIFFICULTY_LABELS[b.difficultyLevel] });
  if (b.guideRecommended !== undefined)
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
  if (b.golfHoles) facts.push({ icon: "⛳", label: `${b.golfHoles} trous` });
  if (b.golfPricing) facts.push({ icon: "💰", label: b.golfPricing });
  return facts;
}

export default function DirectoryClient({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [activeFamily, setActiveFamily] = useState<string | null>(null);
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set());
  const [activeZones, setActiveZones] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(true);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const onBoundsChange = useCallback((b: MapBounds) => setMapBounds(b), []);

  const subcategories = SUBCATEGORIES[active as keyof typeof SUBCATEGORIES];
  const families = FAMILIES[active as keyof typeof FAMILIES];
  const familyChildKeys = useMemo(
    () => new Set(families?.flatMap((f) => f.children) ?? []),
    [families]
  );
  const ungroupedSubcategories = subcategories?.filter((s) => !familyChildKeys.has(s.key)) ?? [];
  const activeFamilyDef = families?.find((f) => f.key === activeFamily);

  function selectCategory(key: string) {
    setActive(key);
    setActiveFamily(null);
    setActiveThemes(new Set());
  }

  function selectFamily(key: string) {
    setActiveFamily((prev) => (prev === key ? null : key));
    setActiveThemes(new Set());
  }

  function toggleZone(key: string) {
    setActiveZones((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTheme(key: string) {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  const familyCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!families) return c;
    businesses.forEach((b) => {
      if (b.category !== active) return;
      families.forEach((f) => {
        if ((b.themes || []).some((t) => f.children.includes(t))) {
          c[f.key] = (c[f.key] || 0) + 1;
        }
      });
    });
    return c;
  }, [businesses, active, families]);

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
        if (activeZones.size > 0 && (!b.zone || !activeZones.has(b.zone))) return false;
        if (active !== "all" && b.category !== active) return false;
        if (activeThemes.size > 0) {
          const themes = b.themes || [];
          const matches =
            (activeThemes.has(UNCLASSIFIED) && themes.length === 0) ||
            themes.some((t) => activeThemes.has(t));
          if (!matches) return false;
        } else if (activeFamilyDef) {
          const themes = b.themes || [];
          if (!themes.some((t) => activeFamilyDef.children.includes(t))) return false;
        }
        if (!q) return true;
        return (b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label)
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0));
  }, [businesses, query, active, activeThemes, activeFamilyDef, activeZones]);

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

  return (
    <div className="app">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="max-w-[1120px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]" />
            Maurice<sup className="text-accent">+</sup>&nbsp;
            <small className="text-muted font-medium">Activités</small>
          </div>
          <div className="text-[13px] text-muted">Île Maurice</div>
        </div>
      </header>

      <section className="max-w-[1120px] mx-auto px-5 pt-11 pb-2">
        <p className="uppercase tracking-[.16em] text-xs font-bold text-primary-deep mb-3.5">
          Annuaire local · Activités, restaurants &amp; adresses utiles
        </p>
        <h1 className="text-[clamp(30px,5vw,46px)] leading-[1.05] tracking-tight max-w-[15ch] text-balance m-0">
          Maurice+, tout trouver <em className="not-italic text-primary">facilement</em>.
        </h1>
        <p className="text-muted text-[17px] leading-[1.55] max-w-[56ch] mt-4">
          Excursions en mer, plongée, spa, restaurants, boutiques… Retrouvez les meilleures
          adresses de l&apos;île en un coup d&apos;œil — puis appelez, visitez leur site ou
          lancez l&apos;itinéraire.
        </p>
        <div className="relative max-w-[520px] mt-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une activité, un lieu, un nom…"
            aria-label="Rechercher"
            autoComplete="off"
            className="w-full h-[52px] pl-11 pr-4 rounded-full border border-border bg-surface text-ink text-base shadow-[0_1px_2px_rgba(13,43,42,.05),0_12px_30px_-14px_rgba(13,43,42,.28)] focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[13px] font-semibold text-muted">📍 Zone :</span>
          {ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => toggleZone(z.key)}
              aria-pressed={activeZones.has(z.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${
                activeZones.has(z.key)
                  ? "bg-primary border-primary text-white"
                  : "bg-surface border-border text-ink hover:border-primary"
              }`}
            >
              {z.emoji} {z.label}
              <span className="text-[11px] font-bold opacity-70">{zoneCounts[z.key] || 0}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="sticky top-[60px] z-10 bg-bg/85 backdrop-blur border-b border-border mt-5 py-3">
        <div className="max-w-[1120px] mx-auto px-5 flex gap-2 overflow-x-auto">
          {[{ key: "all", label: "Tout", emoji: "✨", color: "var(--muted)" }, ...CATEGORIES].map(
            (c) => (
              <button
                key={c.key}
                onClick={() => selectCategory(c.key)}
                aria-pressed={active === c.key}
                className={`flex-none inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
                  active === c.key
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-border text-ink hover:border-primary"
                }`}
              >
                {c.key === "all" ? (
                  "✨"
                ) : (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: (c as (typeof CATEGORIES)[number]).color }}
                  />
                )}
                {c.label}
                <span className="text-xs font-bold opacity-70">
                  {c.key === "all" ? businesses.length : counts[c.key] || 0}
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {subcategories && (
        <div className="sticky top-[108px] z-10 bg-bg/85 backdrop-blur border-b border-border py-2.5">
          <div className="max-w-[1120px] mx-auto px-5 flex gap-2 overflow-x-auto">
            {families?.map((f) => (
              <button
                key={f.key}
                onClick={() => selectFamily(f.key)}
                aria-pressed={activeFamily === f.key}
                className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  activeFamily === f.key
                    ? "bg-primary border-primary text-white"
                    : "bg-surface border-border text-ink hover:border-primary"
                }`}
              >
                {f.emoji} {f.label}
                <span className="text-[11px] font-bold opacity-70">{familyCounts[f.key] || 0}</span>
              </button>
            ))}
            {[...ungroupedSubcategories, { key: UNCLASSIFIED, label: "Non classé", emoji: "❔" }].map(
              (t) => (
                <button
                  key={t.key}
                  onClick={() => toggleTheme(t.key)}
                  aria-pressed={activeThemes.has(t.key)}
                  className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${
                    activeThemes.has(t.key)
                      ? "bg-accent border-accent text-white"
                      : "bg-surface border-border text-muted hover:border-accent hover:text-ink"
                  }`}
                >
                  {t.emoji} {t.label}
                  <span className="text-[11px] font-bold opacity-70">
                    {themeCounts[t.key] || 0}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}

      {activeFamilyDef && (
        <div className="sticky top-[152px] z-10 bg-bg/85 backdrop-blur border-b border-border py-2.5">
          <div className="max-w-[1120px] mx-auto px-5 flex gap-2 overflow-x-auto">
            {activeFamilyDef.children.map((childKey) => {
              const child = subcategories?.find((s) => s.key === childKey);
              if (!child) return null;
              return (
                <button
                  key={child.key}
                  onClick={() => toggleTheme(child.key)}
                  aria-pressed={activeThemes.has(child.key)}
                  className={`flex-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium whitespace-nowrap transition-colors ${
                    activeThemes.has(child.key)
                      ? "bg-accent border-accent text-white"
                      : "bg-surface border-border text-muted hover:border-accent hover:text-ink"
                  }`}
                >
                  {child.emoji} {child.label}
                  <span className="text-[11px] font-bold opacity-70">
                    {themeCounts[child.key] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-[1120px] mx-auto px-5">
        <div className="rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(13,43,42,.05),0_12px_30px_-14px_rgba(13,43,42,.28)] overflow-hidden mt-6">
          <div className="flex items-center justify-between gap-3 flex-wrap px-4.5 py-3.5 border-b border-border">
            <div>
              <strong className="block text-[15px] tracking-tight">Carte des activités</strong>
              <span className="text-[12.5px] text-muted">
                Positions GPS réelles · cliquez un point pour le retrouver dans la liste
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-[13px] font-medium text-ink cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterByMap}
                onChange={(e) => setFilterByMap(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              N&apos;afficher que la zone de la carte
            </label>
          </div>
          <div className="h-[60vh] min-h-[380px] bg-surface-2">
            <Map
              businesses={rows}
              selectedId={selectedId}
              onSelect={selectFromMap}
              onBoundsChange={onBoundsChange}
              fitKey={active}
            />
          </div>
          <p className="text-[11.5px] leading-[1.5] text-muted border-t border-border px-4.5 py-2.5">
            Fond de carte © OpenStreetMap. La carte se charge depuis internet — il faut donc être
            connecté.
          </p>
        </div>

        <p className="text-sm text-muted pt-5 pb-1.5">
          <b className="text-ink tabular-nums">{visibleRows.length}</b> activité
          {visibleRows.length > 1 ? "s" : ""}
          {active !== "all" ? ` · ${CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].emoji} ${CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].label}` : ""}
          {filterByMap ? " · dans la zone visible" : ""}
        </p>

        {visibleRows.length === 0 ? (
          <div className="text-center py-[70px] px-5 text-muted">
            <div className="text-4xl mb-2.5">🔍</div>
            {filterByMap
              ? "Aucune adresse dans cette zone. Dézoomez, déplacez la carte, ou décochez « N'afficher que la zone de la carte »."
              : "Aucun résultat. Essayez un autre mot-clé ou une autre catégorie."}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 py-1.5 pb-16">
            {visibleRows.map((b) => {
              const cat = CATEGORY_MAP[b.category];
              const isActive = b.id === selectedId;
              const accentColor = badgeAccentColor(b.badge);
              const waNumber = whatsappNumber(b);
              return (
                <article
                  key={b.id}
                  ref={(el) => {
                    cardRefs.current[b.id] = el;
                  }}
                  onClick={() => selectFromCard(b.id)}
                  className={`bg-surface border rounded-2xl p-5 shadow-[0_1px_2px_rgba(13,43,42,.05),0_12px_30px_-14px_rgba(13,43,42,.28)] flex flex-col gap-3 cursor-pointer transition-transform hover:-translate-y-1 ${
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
                      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold bg-primary">
                        💛 Coup de cœur
                      </span>
                    )}
                    {b.badge === "selection" && (
                      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold bg-primary-deep">
                        🏅 Sélection Maurice<sup>+</sup>
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
                  <h3 className="m-0 text-[17px] leading-[1.25] tracking-tight">{b.name}</h3>
                  <p className="m-0 text-muted text-[13.5px] leading-[1.5]">{b.address}</p>
                  {b.description && (
                    <p className="m-0 text-ink text-[13.5px] leading-[1.5] -mt-1.5">{b.description}</p>
                  )}
                  {b.hours && (
                    <p className="m-0 text-muted text-[13px] leading-[1.4] -mt-1.5">🕒 {b.hours}</p>
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
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {b.phone ? (
                      <a
                        href={tel(b.phone)}
                        onClick={(e) => {
                          e.stopPropagation();
                          trackEvent(b.id, "call");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold no-underline bg-primary border border-primary text-white"
                      >
                        📞 Appeler
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold bg-surface-2 border border-border text-ink opacity-45">
                        📞 Sans tél.
                      </span>
                    )}
                    {b.email && (
                      <a
                        href={`mailto:${b.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[13px] font-semibold no-underline bg-surface-2 border border-border text-ink hover:border-primary hover:text-primary-deep"
                      >
                        📍 Itinéraire
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-border py-5 pb-10 text-muted text-[13px] leading-[1.6]">
        <div className="max-w-[1120px] mx-auto px-5">
          <b className="text-ink">Aperçu MVP</b> — sélection de {businesses.length} fiches issues
          de l&apos;import Google Places, couvrant toute l&apos;île. Les données seront enrichies
          et vérifiées avant mise en ligne. Statut, horaires et photos viendront ensuite.
        </div>
      </footer>
    </div>
  );
}
