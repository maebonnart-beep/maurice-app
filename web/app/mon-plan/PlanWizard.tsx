"use client";

import { useMemo, useState } from "react";
import type { Business } from "@/lib/types";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { FilterChip } from "@/components/ui/FilterChip";
import {
  PLAN_ACTIVITIES,
  PLAN_DURATIONS,
  PLAN_MEALS,
  PLAN_WHO,
  PLAN_ZONES,
  buildPlan,
  formatMinutes,
  parsePlanText,
  type PlanActivity,
  type PlanCriteria,
  type PlanMeal,
  type PlanWho,
  type PlanZone,
} from "@/lib/plan";

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

export default function PlanWizard({ businesses }: { businesses: Business[] }) {
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

  const combos = useMemo(() => (submitted ? buildPlan(businesses, submitted) : []), [businesses, submitted]);
  const visible = combos.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasMore = (page + 1) * PAGE_SIZE < combos.length;

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
        Dis-nous ce que tu veux faire : on te propose une activité et un resto proche, avec le temps total estimé.
      </p>

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
              <h2 className="text-[15px] font-extrabold text-ink">Idée {page * PAGE_SIZE + i + 1}</h2>
              <p className="text-[12px] font-bold text-primary">≈ {formatMinutes(c.totalMinutes)} au total</p>
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted leading-snug">
              Activité {c.activityEstimated ? "≈ " : ""}
              {formatMinutes(c.activityMinutes)}
              {c.activityEstimated ? " (durée estimée)" : ""}
              {c.restaurant && ` · route ≈ ${formatMinutes(c.travelMinutes)} · repas ≈ ${formatMinutes(c.mealMinutes)}`}
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

      {openBusiness && <BusinessDetail business={openBusiness} onClose={() => setOpenBusiness(null)} />}
    </main>
  );
}
