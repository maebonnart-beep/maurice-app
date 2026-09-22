"use client";

import { useMemo, useState } from "react";
import type { Business, PriceRange } from "@/lib/types";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { FilterChip } from "@/components/ui/FilterChip";
import {
  PLAN_ACTIVITIES,
  PLAN_BUDGETS,
  PLAN_DURATIONS,
  PLAN_MEALS,
  PLAN_SETTINGS,
  PLAN_WHO,
  PLAN_ZONES,
  buildPlan,
  buildRestaurantList,
  formatMinutes,
  parsePlanText,
  type PlanActivity,
  type PlanCriteria,
  type PlanMeal,
  type PlanWho,
  type PlanZone,
  type RestoSetting,
} from "@/lib/plan";

/** Cuisines proposées pour le mode « Trouver un resto » : mêmes options que le plan complet, sans « Pas de repas » (hors-sujet ici). */
const RESTO_MEALS = PLAN_MEALS.filter((m) => m.key !== "aucun");

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

export default function PlanWizard({ businesses }: { businesses: Business[] }) {
  // « Plan complet » (programme à étapes) vs « Trouver un resto » (liste simple,
  // 3 critères) : deux façons d'utiliser Mon plan, mêmes champs qui/zone/repas
  // partagés entre les deux pour ne pas re-demander la même chose en changeant d'onglet.
  const [mode, setMode] = useState<"plan" | "resto">("plan");
  const [who, setWho] = useState<PlanWho>("famille");
  const [zone, setZone] = useState<PlanZone>("sud");
  const [activity, setActivity] = useState<PlanActivity>("excursion");
  const [meal, setMeal] = useState<PlanMeal>("mauricienne");
  const [maxMinutes, setMaxMinutes] = useState(180);
  const [submitted, setSubmitted] = useState<PlanCriteria | null>(null);
  const [page, setPage] = useState(0);
  const [openBusiness, setOpenBusiness] = useState<Business | null>(null);
  const [text, setText] = useState("");
  const [textHint, setTextHint] = useState<string | null>(null);
  const [restoView, setRestoView] = useState(false);
  const [restoSetting, setRestoSetting] = useState<RestoSetting>("tous");
  const [restoBudget, setRestoBudget] = useState<PriceRange | "tous">("tous");
  const [restoSubmitted, setRestoSubmitted] = useState<{
    who: PlanWho;
    zone: PlanZone;
    meal: Exclude<PlanMeal, "aucun">;
    view: boolean;
    setting: RestoSetting;
    budget: PriceRange | "tous";
  } | null>(null);
  const [restoPage, setRestoPage] = useState(0);

  const combos = useMemo(() => (submitted ? buildPlan(businesses, submitted) : []), [businesses, submitted]);
  const visible = combos.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasMore = (page + 1) * PAGE_SIZE < combos.length;

  const restoResults = useMemo(
    () => (restoSubmitted ? buildRestaurantList(businesses, restoSubmitted) : []),
    [businesses, restoSubmitted],
  );
  const restoVisible = restoResults.slice(restoPage * RESTO_PAGE_SIZE, restoPage * RESTO_PAGE_SIZE + RESTO_PAGE_SIZE);
  const restoHasMore = (restoPage + 1) * RESTO_PAGE_SIZE < restoResults.length;

  const submitResto = () => {
    setRestoSubmitted({ who, zone, meal: meal === "aucun" ? "tous" : meal, view: restoView, setting: restoSetting, budget: restoBudget });
    setRestoPage(0);
    requestAnimationFrame(() =>
      document.getElementById("resto-resultats")?.scrollIntoView({ behavior: "smooth", block: "start" }),
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
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      <h1 className="text-[22px] font-extrabold text-ink leading-tight">Créer mon plan</h1>
      <p className="mt-1 text-[13px] text-muted leading-snug">
        {mode === "plan"
          ? "Dis-nous ce que tu veux faire : on te propose une activité et un resto proche, avec le temps total estimé."
          : "Juste un resto : dis-nous pour qui, où et quelle cuisine, on te fait une liste."}
      </p>

      {/* Deux façons d'utiliser Mon plan : un programme à étapes (activité + resto,
          voire plus), ou directement une liste de restaurants sans passer par une
          activité — pour qui sait déjà qu'il veut « juste manger quelque part ». */}
      <div className="mt-4 inline-flex rounded-pill border border-border bg-surface p-1">
        <button
          onClick={() => setMode("plan")}
          aria-pressed={mode === "plan"}
          className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
            mode === "plan" ? "bg-primary text-white" : "text-ink"
          }`}
        >
          Plan complet
        </button>
        <button
          onClick={() => setMode("resto")}
          aria-pressed={mode === "resto"}
          className={`rounded-pill px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
            mode === "resto" ? "bg-primary text-white" : "text-ink"
          }`}
        >
          Trouver un resto
        </button>
      </div>

      {mode === "resto" ? (
        <>
          <Question title="Vous êtes ?" options={PLAN_WHO.map((o) => ({ key: o.key, label: o.label }))} value={who} onChange={setWho} />
          <Question title="Où ?" options={PLAN_ZONES.map((o) => ({ key: o.key, label: o.label }))} value={zone} onChange={setZone} />
          <Question
            title="Quelle cuisine ?"
            options={RESTO_MEALS.map((o) => ({ key: o.key, label: o.label }))}
            value={meal === "aucun" ? "tous" : meal}
            onChange={setMeal}
          />
          <Question
            title="Cadre ?"
            options={PLAN_SETTINGS.map((o) => ({ key: o.key, label: o.label }))}
            value={restoSetting}
            onChange={setRestoSetting}
          />
          <Question
            title="Budget ?"
            options={PLAN_BUDGETS.map((o) => ({ key: o.key, label: o.label }))}
            value={restoBudget}
            onChange={setRestoBudget}
          />
          <section className="mt-5">
            <h2 className="text-[14px] font-extrabold text-ink">Autre chose ?</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterChip active={restoView} onClick={() => setRestoView((v) => !v)}>
                🌅 Belle vue
              </FilterChip>
            </div>
          </section>

          <button
            onClick={submitResto}
            className="mt-7 w-full rounded-pill bg-primary px-4 py-3 text-[15px] font-extrabold text-white shadow-card active:scale-[.98] transition-transform"
          >
            Voir les restos
          </button>

          <div id="resto-resultats" className="mt-8 scroll-mt-4">
            {restoSubmitted && restoResults.length === 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4 text-[13px] text-ink">
                <p className="font-bold">Aucun restaurant ne correspond à ces critères.</p>
                <p className="mt-1 text-muted">Essaie « Peu importe » pour un ou plusieurs critères (zone, cuisine, cadre, budget).</p>
              </div>
            )}

            {restoVisible.length > 0 && (
              <p className="mb-3 text-[12px] font-semibold text-muted">
                {restoResults.length} restaurant{restoResults.length > 1 ? "s" : ""}
              </p>
            )}

            <div className="space-y-3">
              {restoVisible.map((b) => (
                <BusinessCard key={b.id} business={b} active={false} onSelect={() => setOpenBusiness(b)} onHover={() => {}} />
              ))}
            </div>

            {restoHasMore && (
              <button
                onClick={() => setRestoPage((p) => p + 1)}
                className="mt-3 w-full rounded-pill border border-primary px-4 py-2.5 text-[14px] font-bold text-primary active:scale-[.98] transition-transform"
              >
                Voir d&apos;autres restos
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
