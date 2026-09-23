"use client";

import { useMemo, useState } from "react";
import type { Business, PriceRange } from "@/lib/types";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { FilterChip } from "@/components/ui/FilterChip";
import { FILTER_GROUPS, SUBCATEGORIES } from "@/data/categories";
import {
  PLAN_ACTIVITIES,
  PLAN_BUDGETS,
  PLAN_DURATIONS,
  PLAN_MEALS,
  PLAN_SETTINGS,
  PLAN_WHO,
  PLAN_ZONES,
  buildPlan,
  buildPlaceList,
  PLACE_THEMES,
  formatMinutes,
  parsePlanText,
  type PlanActivity,
  type PlanCriteria,
  type PlanMeal,
  type PlanWho,
  type PlanZone,
  type PlaceCriteria,
  type PlaceTheme,
  type RestoSetting,
} from "@/lib/plan";

/** Libellé des sous-rubriques (ex. Visite → Culture & patrimoine / Plages & nature…). */
const RUBRIQUE_LABEL: Record<string, { label: string; emoji: string }> = Object.fromEntries(
  Object.values(SUBCATEGORIES).flatMap((subs) => (subs ?? []).map((s) => [s.key, { label: s.label, emoji: s.emoji }])),
);

/** Groupes de filtres existants qui s’appliquent à au moins une des rubriques données. */
function groupsFor(rubriques: string[]) {
  return FILTER_GROUPS.filter((g) => g.appliesTo.some((k) => rubriques.includes(k)));
}

const PAGE_SIZE = 3;

function Question<T extends string | number>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-[14px] font-extrabold text-ink">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <FilterChip key={String(o.key)} active={value === o.key} onClick={() => onChange(o.key)}>
            {o.label}
          </FilterChip>
        ))}
      </div>
    </section>
  );
}

const RESTO_PAGE_SIZE = 6;

export default function PlanWizard({
  businesses,
  initialMode = "lieu",
}: {
  businesses: Business[];
  initialMode?: "lieu" | "plan";
}) {
  // « Trouver un lieu » (liste simple par thématique) vs « Plan complet »
  // (programme à étapes) : deux façons d'utiliser Mon plan, mêmes champs
  // qui/zone partagés entre les deux pour ne pas re-demander la même chose en
  // changeant d'onglet. « Trouver un lieu » d'abord : c'est le besoin le plus courant.
  const [mode, setMode] = useState<"lieu" | "plan">(initialMode);
  const [who, setWho] = useState<PlanWho>("famille");
  const [zone, setZone] = useState<PlanZone>(initialMode === "lieu" ? "partout" : "sud");
  const [activity, setActivity] = useState<PlanActivity>("excursion");
  const [meal, setMeal] = useState<PlanMeal>("mauricienne");
  const [maxMinutes, setMaxMinutes] = useState(180);
  const [submitted, setSubmitted] = useState<PlanCriteria | null>(null);
  const [page, setPage] = useState(0);
  const [openBusiness, setOpenBusiness] = useState<Business | null>(null);
  const [text, setText] = useState("");
  const [textHint, setTextHint] = useState<string | null>(null);
  const [placeTheme, setPlaceTheme] = useState<PlaceTheme>("resto");
  const [placeText, setPlaceText] = useState("");
  const [placeRubriques, setPlaceRubriques] = useState<string[]>([]);
  const [placeOptions, setPlaceOptions] = useState<Record<string, string[]>>({});
  const [placeSetting, setPlaceSetting] = useState<RestoSetting>("tous");
  const [placeBudget, setPlaceBudget] = useState<PriceRange | "tous">("tous");
  const [placeFeatured, setPlaceFeatured] = useState(false);
  const [placeOpenNow, setPlaceOpenNow] = useState(false);
  const [placeTerrace, setPlaceTerrace] = useState(false);
  const [placeSubmitted, setPlaceSubmitted] = useState<PlaceCriteria | null>(null);
  const [placePage, setPlacePage] = useState(0);

  const combos = useMemo(() => (submitted ? buildPlan(businesses, submitted) : []), [businesses, submitted]);
  const visible = combos.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasMore = (page + 1) * PAGE_SIZE < combos.length;

  const theme = PLACE_THEMES.find((t) => t.key === placeTheme)!;
  // Sous-critères affichés : ceux des rubriques retenues (toutes celles de la
  // thématique tant qu'aucune n'est cochée).
  const activeRubriques = placeRubriques.length > 0 ? placeRubriques : theme.rubriques;
  const placeGroups = groupsFor(activeRubriques).filter((g) => !theme.hiddenGroups?.includes(g.key));

  const placeResults = useMemo(
    () => (placeSubmitted ? buildPlaceList(businesses, placeSubmitted, FILTER_GROUPS) : []),
    [businesses, placeSubmitted],
  );
  const placeVisible = placeResults.slice(0, (placePage + 1) * RESTO_PAGE_SIZE);
  const placeHasMore = placeVisible.length < placeResults.length;

  const chooseTheme = (t: PlaceTheme) => {
    setPlaceTheme(t);
    setPlaceRubriques([]);
    setPlaceOptions({});
    setPlaceSetting("tous");
    setPlaceSubmitted(null);
  };

  const toggleRubrique = (r: string) => {
    const next = placeRubriques.includes(r) ? placeRubriques.filter((x) => x !== r) : [...placeRubriques, r];
    setPlaceRubriques(next);
    // Retire les options de groupes qui ne s'appliquent plus aux rubriques retenues.
    const keep = new Set(groupsFor(next.length > 0 ? next : theme.rubriques).map((g) => g.key));
    setPlaceOptions((o) => Object.fromEntries(Object.entries(o).filter(([g]) => keep.has(g))));
  };

  const toggleOption = (group: string, opt: string) =>
    setPlaceOptions((o) => {
      const cur = o[group] ?? [];
      return { ...o, [group]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });

  const submitPlace = () => {
    setPlaceSubmitted({
      theme: placeTheme,
      who,
      zone,
      text: placeText,
      rubriques: placeRubriques,
      options: placeOptions,
      setting: placeSetting,
      budget: placeBudget,
      featured: placeFeatured,
      openNow: placeOpenNow,
      terrace: placeTerrace,
    });
    setPlacePage(0);
    requestAnimationFrame(() =>
      document.getElementById("lieu-resultats")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const run = (c: PlanCriteria) => {
    setSubmitted(c);
    setPage(0);
    requestAnimationFrame(() =>
      document.getElementById("plan-resultats")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const submit = () => run({ who, zone, activity, meal, maxMinutes });

  // Phrase libre : on lit les critères reconnus, on les reporte sur les puces
  // (l'utilisateur voit ce qui a été compris et peut corriger), puis on lance.
  const submitText = () => {
    const found = parsePlanText(text);
    if (Object.keys(found).length === 0) {
      setTextHint("Je n'ai rien reconnu. Essaie par exemple : « excursion en famille dans le sud, resto créole, max 3h ».");
      return;
    }
    const next: PlanCriteria = { who, zone, activity, meal, maxMinutes, ...found };
    setWho(next.who);
    setZone(next.zone);
    setActivity(next.activity);
    setMeal(next.meal);
    setMaxMinutes(next.maxMinutes);
    const labels = [
      found.who && PLAN_WHO.find((o) => o.key === found.who)?.label,
      found.zone && PLAN_ZONES.find((o) => o.key === found.zone)?.label,
      found.activity && PLAN_ACTIVITIES.find((o) => o.key === found.activity)?.label,
      found.meal && PLAN_MEALS.find((o) => o.key === found.meal)?.label,
      found.maxMinutes && `≤ ${formatMinutes(found.maxMinutes)}`,
    ].filter(Boolean);
    const missing = [
      !found.who && "groupe",
      !found.zone && "zone",
      !found.activity && "activité",
      !found.meal && "repas",
      !found.maxMinutes && "durée",
    ].filter(Boolean);
    setTextHint(
      `J'ai compris : ${labels.join(" · ")}.` +
        (missing.length ? ` Non précisé (choix des puces gardé) : ${missing.join(", ")}.` : ""),
    );
    run(next);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5">
      <h1 className="text-[22px] font-extrabold text-ink leading-tight">Créer mon plan</h1>
      <p className="mt-1 text-[13px] text-muted leading-snug">
        {mode === "plan"
          ? "Dis-nous ce que tu veux faire : on te propose une activité et un resto proche, avec le temps total estimé."
          : "Un resto, un bar, une plage, une excursion, une visite ou du shopping : choisis la thématique et tes critères, on te fait une liste."}
      </p>

      {/* Deux façons d'utiliser Mon plan : directement une liste de lieux pour une
          thématique (le besoin le plus courant, d'où la 1re place), ou un
          programme à étapes (activité + resto, voire plus). */}
      <div className="mt-4 inline-flex rounded-pill border border-border bg-surface p-1">
        <button
          onClick={() => setMode("lieu")}
          aria-pressed={mode === "lieu"}
          className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
            mode === "lieu" ? "bg-primary text-white" : "text-ink"
          }`}
        >
          Trouver un lieu
        </button>
        <button
          onClick={() => setMode("plan")}
          aria-pressed={mode === "plan"}
          className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
            mode === "plan" ? "bg-primary text-white" : "text-ink"
          }`}
        >
          Plan complet
        </button>
      </div>

      {mode === "lieu" ? (
        <>
          <section className="mt-5">
            <label htmlFor="lieu-texte" className="text-[14px] font-extrabold text-ink">
              Tu cherches quoi ?
            </label>
            <input
              id="lieu-texte"
              type="search"
              value={placeText}
              onChange={(e) => setPlaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitPlace();
                }
              }}
              placeholder="Ex. : Grand Baie, cocktails, dauphins…"
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </section>

          <section className="mt-5">
            <h2 className="text-[14px] font-extrabold text-ink">Thématique</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PLACE_THEMES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => chooseTheme(t.key)}
                  aria-pressed={placeTheme === t.key}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 px-1 transition-colors active:scale-[.96] ${
                    placeTheme === t.key ? "border-primary bg-primary text-white" : "border-border bg-surface text-ink"
                  }`}
                >
                  <span className="text-[20px]" aria-hidden>{t.emoji}</span>
                  <span className="text-[11.5px] font-bold leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Thématique à plusieurs rubriques (Visite) : on laisse choisir
              lesquelles — les sous-critères suivent la sélection. */}
          {theme.rubriques.length > 1 && (
            <section className="mt-5">
              <h2 className="text-[14px] font-extrabold text-ink">Quel genre ?</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {theme.rubriques.map((r) => (
                  <FilterChip key={r} active={placeRubriques.includes(r)} onClick={() => toggleRubrique(r)}>
                    {RUBRIQUE_LABEL[r]?.emoji} {RUBRIQUE_LABEL[r]?.label ?? r}
                  </FilterChip>
                ))}
              </div>
            </section>
          )}

          {/* Sous-critères : les filtres déjà définis pour les rubriques de la
              thématique (cuisine, ambiance, type de bar, île…). */}
          {placeGroups.map((g) => (
            <section key={g.key} className="mt-5">
              <h2 className="text-[14px] font-extrabold text-ink">
                {g.label}
                {/* Thématique à plusieurs rubriques : plusieurs groupes peuvent
                    porter le même nom (« Type de boutique ») → on précise la rubrique. */}
                {theme.rubriques.length > 1 && (
                  <span className="font-semibold text-muted">
                    {" · "}
                    {g.appliesTo.filter((k) => theme.rubriques.includes(k)).map((k) => RUBRIQUE_LABEL[k]?.label ?? k).join(", ")}
                  </span>
                )}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.options.map((o) => (
                  <FilterChip
                    key={o.key}
                    active={(placeOptions[g.key] ?? []).includes(o.key)}
                    onClick={() => toggleOption(g.key, o.key)}
                  >
                    {o.emoji} {o.label}
                  </FilterChip>
                ))}
              </div>
            </section>
          ))}

          {placeTheme === "resto" && (
            <Question
              title="Cadre ?"
              options={PLAN_SETTINGS.map((o) => ({ key: o.key, label: o.label }))}
              value={placeSetting}
              onChange={setPlaceSetting}
            />
          )}
          <Question title="Vous êtes ?" options={PLAN_WHO.map((o) => ({ key: o.key, label: o.label }))} value={who} onChange={setWho} />
          <Question title="Où ?" options={PLAN_ZONES.map((o) => ({ key: o.key, label: o.label }))} value={zone} onChange={setZone} />
          <Question
            title="Budget ?"
            options={PLAN_BUDGETS.map((o) => ({ key: o.key, label: o.label }))}
            value={placeBudget}
            onChange={setPlaceBudget}
          />
          <section className="mt-5">
            <h2 className="text-[14px] font-extrabold text-ink">Autre chose ?</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(placeTheme === "resto" || placeTheme === "bar") && (
                <FilterChip active={placeTerrace} onClick={() => setPlaceTerrace((v) => !v)}>
                  🌿 Terrasse
                </FilterChip>
              )}
              <FilterChip active={placeFeatured} onClick={() => setPlaceFeatured((v) => !v)}>
                ⭐ Coup de cœur Koté Moris
              </FilterChip>
              <FilterChip active={placeOpenNow} onClick={() => setPlaceOpenNow((v) => !v)}>
                🕐 Ouvert maintenant
              </FilterChip>
            </div>
          </section>

          <button
            onClick={submitPlace}
            className="mt-7 w-full rounded-pill bg-primary px-4 py-3 text-[15px] font-extrabold text-white shadow-card active:scale-[.98] transition-transform"
          >
            Voir les adresses
          </button>

          <div id="lieu-resultats" className="mt-8 scroll-mt-4">
            {placeSubmitted && placeResults.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4 text-[13px] text-ink">
                <p className="font-bold">Aucune adresse ne correspond à ces critères.</p>
                <p className="mt-1 text-muted">
                  Essaie avec moins de mots dans le texte, moins de critères cochés, ou « Peu importe » pour la zone ou le budget.
                </p>
              </div>
            )}

            {placeVisible.length > 0 && (
              <p className="mb-3 text-[12px] font-semibold text-muted">
                {placeResults.length} adresse{placeResults.length > 1 ? "s" : ""}
              </p>
            )}

            <div className="space-y-3">
              {placeVisible.map((b) => (
                <BusinessCard key={b.id} business={b} active={false} onSelect={() => setOpenBusiness(b)} onHover={() => {}} />
              ))}
            </div>

            {placeHasMore && (
              <button
                onClick={() => setPlacePage((p) => p + 1)}
                className="mt-3 w-full rounded-pill border border-primary px-4 py-2.5 text-[14px] font-bold text-primary active:scale-[.98] transition-transform"
              >
                Voir plus d&apos;adresses
              </button>
            )}
          </div>
        </>
      ) : (
        <>
      <section className="mt-5">
        <label htmlFor="plan-texte" className="text-[14px] font-extrabold text-ink">
          Décris ta sortie en une phrase
        </label>
        <textarea
          id="plan-texte"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitText();
            }
          }}
          rows={2}
          placeholder="Ex. : excursion en famille dans le sud avec resto créole, max 3h le tout"
          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          onClick={submitText}
          disabled={text.trim() === ""}
          className="mt-2 w-full rounded-pill bg-primary px-4 py-2.5 text-[14px] font-extrabold text-white shadow-card active:scale-[.98] transition-transform disabled:opacity-40"
        >
          Trouver mon plan
        </button>
        {textHint && <p className="mt-2 text-[12px] text-muted leading-snug">{textHint}</p>}
        <p className="mt-5 text-[12px] font-semibold text-muted">Ou choisis avec les puces :</p>
      </section>

      <Question title="Vous êtes ?" options={PLAN_WHO.map((o) => ({ key: o.key, label: o.label }))} value={who} onChange={setWho} />
      <Question title="Où ?" options={PLAN_ZONES.map((o) => ({ key: o.key, label: o.label }))} value={zone} onChange={setZone} />
      <Question
        title="Quoi ?"
        options={PLAN_ACTIVITIES.map((o) => ({ key: o.key, label: o.label }))}
        value={activity}
        onChange={setActivity}
      />
      <Question title="Repas ?" options={PLAN_MEALS.map((o) => ({ key: o.key, label: o.label }))} value={meal} onChange={setMeal} />
      <Question
        title="Durée maximum (route et repas compris)"
        options={PLAN_DURATIONS.map((o) => ({ key: o.minutes, label: o.label }))}
        value={maxMinutes}
        onChange={setMaxMinutes}
      />

      <button
        onClick={submit}
        className="mt-7 w-full rounded-pill bg-primary px-4 py-3 text-[15px] font-extrabold text-white shadow-card active:scale-[.98] transition-transform"
      >
        Voir mon plan
      </button>

      <div id="plan-resultats" className="mt-8 scroll-mt-4">
        {submitted && combos.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-[13px] text-ink">
            <p className="font-bold">Aucun plan ne correspond à ces critères.</p>
            <p className="mt-1 text-muted">
              Essaie d&apos;allonger la durée, de choisir « Peu importe » pour la zone ou le repas, ou une autre activité.
            </p>
          </div>
        )}

        {visible.map((c, i) => (
          <article key={c.activity.id} className="mb-6">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-extrabold text-ink">
                {1 + (c.restaurant ? 1 : 0) + c.extras.length > 1 ? "Plan" : "Adresse"} {page * PAGE_SIZE + i + 1}
                {1 + (c.restaurant ? 1 : 0) + c.extras.length > 1 && (
                  <span className="ml-1.5 text-[12px] font-semibold text-muted">
                    · {1 + (c.restaurant ? 1 : 0) + c.extras.length} étapes
                  </span>
                )}
              </h2>
              <p className="text-[12px] font-bold text-primary">≈ {formatMinutes(c.totalMinutes)} au total</p>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted leading-snug">
              1. {c.activityEstimated ? "≈ " : ""}
              {formatMinutes(c.activityMinutes)}
              {c.activityEstimated ? " (durée estimée)" : ""}
              {c.restaurant && ` · route ≈ ${formatMinutes(c.travelMinutes)} · 2. repas ≈ ${formatMinutes(c.mealMinutes)}`}
              {c.extras.map((e, k) => {
                const n = 2 + (c.restaurant ? 1 : 0) + k;
                return ` · route ≈ ${formatMinutes(e.travelMinutes)} · ${n}. ${e.estimated ? "≈ " : ""}${formatMinutes(e.minutes)}`;
              })}
            </p>

            <div className="mt-3 space-y-3">
              <BusinessCard
                business={c.activity}
                active={false}
                onSelect={() => setOpenBusiness(c.activity)}
                onHover={() => {}}
              />
              {c.restaurant && (
                <BusinessCard
                  business={c.restaurant}
                  active={false}
                  onSelect={() => setOpenBusiness(c.restaurant!)}
                  onHover={() => {}}
                  nearbyKm={c.legKm}
                />
              )}
              {c.extras.map((e) => (
                <BusinessCard
                  key={e.business.id}
                  business={e.business}
                  active={false}
                  onSelect={() => setOpenBusiness(e.business)}
                  onHover={() => {}}
                  nearbyKm={e.legKm}
                />
              ))}
            </div>
          </article>
        ))}

        {hasMore && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full rounded-pill border border-primary px-4 py-2.5 text-[14px] font-bold text-primary active:scale-[.98] transition-transform"
          >
            Voir d&apos;autres idées
          </button>
        )}
      </div>
        </>
      )}

      {openBusiness && <BusinessDetail business={openBusiness} onClose={() => setOpenBusiness(null)} />}
    </main>
  );
}
