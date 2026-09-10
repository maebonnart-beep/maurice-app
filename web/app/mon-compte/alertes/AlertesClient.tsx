"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash, BellRinging } from "@phosphor-icons/react";
import { LISTING_CATEGORIES, type ListingCategoryKey, type ListingZone } from "@/lib/marketplace/types";
import { SUBCATEGORIES, FILTER_GROUPS } from "@/data/categories";
import type { SavedSearch, SavedSearchType } from "@/lib/alerts/types";
import { mapSavedSearchRow } from "@/lib/alerts/mapRow";

const inputClass =
  "w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary";
const labelClass = "block text-[12px] font-semibold text-muted mb-1.5";

const ZONES: { key: ListingZone; label: string }[] = [
  { key: "nord", label: "Nord" },
  { key: "sud", label: "Sud" },
  { key: "est", label: "Est" },
  { key: "ouest", label: "Ouest" },
  { key: "centre", label: "Centre" },
];

const EVENT_THEMES = SUBCATEGORIES["agenda"] ?? [];
const EVENT_FILTER_OPTIONS = FILTER_GROUPS.filter((g) =>
  g.appliesTo.some((k) => EVENT_THEMES.some((t) => t.key === k))
).flatMap((g) => g.options);

function toggleInList(list: string[], key: string): string[] {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

export function AlertesClient({
  prefill,
}: {
  prefill: {
    type?: SavedSearchType;
    category?: string;
    zone?: string;
    themes?: string[];
    filters?: string[];
  };
}) {
  // Venue d'une fiche/rubrique (type imposé par le contexte) : pas de choix à
  // afficher, juste le formulaire pour ce type-là. Venue de "Mon compte" (pas
  // de type dans l'URL) : le choix Annonces/Événements est affiché.
  const typeLocked = prefill.type !== undefined;
  const [alerts, setAlerts] = useState<SavedSearch[] | null>(null);
  const [type, setType] = useState<SavedSearchType>(prefill.type ?? "listing");
  const [category, setCategory] = useState<ListingCategoryKey | "">(
    (prefill.category as ListingCategoryKey) ?? ""
  );
  const [zone, setZone] = useState<ListingZone | "">((prefill.zone as ListingZone) ?? "");
  const [maxPrice, setMaxPrice] = useState("");
  const [themes, setThemes] = useState<string[]>(prefill.themes ?? []);
  const [eventFilters, setEventFilters] = useState<string[]>(prefill.filters ?? []);
  const [keyword, setKeyword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadAlerts() {
    fetch("/api/alerts")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Record<string, unknown>[]) => setAlerts(rows.map(mapSavedSearchRow)));
  }

  useEffect(loadAlerts, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const criteria =
      type === "listing"
        ? {
            category: category || undefined,
            zone: zone || undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            keyword: keyword.trim() || undefined,
          }
        : {
            themes: themes.length > 0 ? themes : undefined,
            filters: eventFilters.length > 0 ? eventFilters : undefined,
            keyword: keyword.trim() || undefined,
          };

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, criteria }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    setCategory("");
    setZone("");
    setMaxPrice("");
    setThemes([]);
    setEventFilters([]);
    setKeyword("");
    setSubmitting(false);
    loadAlerts();
  }

  async function remove(id: number) {
    setAlerts((prev) => prev?.filter((a) => a.id !== id) ?? null);
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
  }

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-5">
      <div>
        <p className="font-serif text-xl font-semibold leading-tight">Mes alertes</p>
        <p className="text-[13px] text-muted">
          Reçois un email quand une nouvelle annonce ou un nouvel événement correspond à tes critères.
        </p>
      </div>

      {alerts === null ? (
        <p className="text-center text-muted text-[13px]">Chargement…</p>
      ) : alerts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary-tint text-primary-deep flex items-center justify-center">
                  <BellRinging size={16} weight="fill" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-[13.5px] font-semibold truncate">{a.label}</p>
                  <p className="m-0 text-[11.5px] text-muted">
                    {a.type === "listing" ? "Annonces seconde main" : "Événements"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                aria-label="Supprimer l'alerte"
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-600"
              >
                <Trash size={16} weight="bold" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-surface border border-border rounded-2xl p-4">
        <p className="font-serif text-[15px] font-semibold leading-tight">
          {typeLocked
            ? `Créer une alerte ${type === "listing" ? "annonces" : "événements"}`
            : "Créer une alerte"}
        </p>

        {!typeLocked && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("listing")}
              className={`flex-1 h-[38px] rounded-xl text-[13px] font-semibold border ${
                type === "listing" ? "bg-primary text-white border-primary" : "border-border text-ink"
              }`}
            >
              Annonces
            </button>
            <button
              type="button"
              onClick={() => setType("event")}
              className={`flex-1 h-[38px] rounded-xl text-[13px] font-semibold border ${
                type === "event" ? "bg-primary text-white border-primary" : "border-border text-ink"
              }`}
            >
              Événements
            </button>
          </div>
        )}

        {type === "listing" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="al-categorie">
                  Catégorie
                </label>
                <select
                  id="al-categorie"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ListingCategoryKey)}
                  className={inputClass}
                >
                  <option value="">Toutes</option>
                  {LISTING_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="al-zone">
                  Zone
                </label>
                <select
                  id="al-zone"
                  value={zone}
                  onChange={(e) => setZone(e.target.value as ListingZone)}
                  className={inputClass}
                >
                  <option value="">Toutes</option>
                  {ZONES.map((z) => (
                    <option key={z.key} value={z.key}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="al-prix">
                Prix maximum (Rs)
              </label>
              <input
                id="al-prix"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Ex. 5000"
                className={inputClass}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <span className={labelClass}>Type d&apos;événement</span>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setThemes((prev) => toggleInList(prev, t.key))}
                    className={`text-[12.5px] font-semibold px-2.5 py-1 rounded-pill border ${
                      themes.includes(t.key) ? "bg-primary text-white border-primary" : "border-border text-ink"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={labelClass}>Nature</span>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_FILTER_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setEventFilters((prev) => toggleInList(prev, o.key))}
                    className={`text-[12.5px] font-semibold px-2.5 py-1 rounded-pill border ${
                      eventFilters.includes(o.key) ? "bg-primary text-white border-primary" : "border-border text-ink"
                    }`}
                  >
                    {o.emoji} {o.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={labelClass} htmlFor="al-motcle">
            Mot-clé
          </label>
          <input
            id="al-motcle"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={type === "listing" ? "Ex. vélo" : "Ex. jazz"}
            className={inputClass}
          />
        </div>

        {error && <p className="text-[12.5px] text-red-600 text-center">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-[46px] rounded-xl font-semibold text-[14px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
        >
          {submitting ? "Création…" : "Créer l'alerte"}
        </button>
      </form>
    </div>
  );
}
