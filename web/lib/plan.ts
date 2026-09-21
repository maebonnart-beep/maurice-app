import type { Business } from "@/lib/types";
import { haversineKm } from "@/lib/geo";

export type PlanWho = "famille" | "couple" | "amis" | "solo";
export type PlanZone = "nord" | "sud" | "est" | "ouest" | "centre" | "partout";
export type PlanActivity = "excursion" | "plage" | "parc" | "culture" | "rando";
export type PlanMeal = "mauricienne" | "indienne" | "asiatique" | "europeenne" | "tous" | "aucun";

export interface PlanCriteria {
  who: PlanWho;
  zone: PlanZone;
  activity: PlanActivity;
  meal: PlanMeal;
  maxMinutes: number;
}

export interface PlanCombo {
  activity: Business;
  restaurant?: Business;
  /** Distance activité → restaurant (km, à vol d'oiseau). */
  legKm?: number;
  activityMinutes: number;
  /** true si la durée de l'activité n'est pas renseignée sur la fiche (estimation par défaut). */
  activityEstimated: boolean;
  travelMinutes: number;
  mealMinutes: number;
  totalMinutes: number;
}

export const PLAN_WHO: { key: PlanWho; label: string }[] = [
  { key: "famille", label: "En famille" },
  { key: "couple", label: "En couple" },
  { key: "amis", label: "Entre amis" },
  { key: "solo", label: "Solo" },
];

export const PLAN_ZONES: { key: PlanZone; label: string }[] = [
  { key: "nord", label: "Nord" },
  { key: "sud", label: "Sud" },
  { key: "est", label: "Est" },
  { key: "ouest", label: "Ouest" },
  { key: "centre", label: "Centre" },
  { key: "partout", label: "Peu importe" },
];

export const PLAN_ACTIVITIES: { key: PlanActivity; label: string; themes: string[]; defaultMinutes: number }[] = [
  { key: "excursion", label: "Excursion", themes: ["excursions-sorties"], defaultMinutes: 90 },
  { key: "plage", label: "Plage & nature", themes: ["plages-nature"], defaultMinutes: 60 },
  { key: "parc", label: "Parc & activités", themes: ["parcs-activites-famille", "activites-enfants-famille"], defaultMinutes: 90 },
  { key: "culture", label: "Culture & patrimoine", themes: ["culture-patrimoine"], defaultMinutes: 60 },
  { key: "rando", label: "Randonnée", themes: ["randonnee-trail"], defaultMinutes: 120 },
];

export const PLAN_MEALS: { key: PlanMeal; label: string }[] = [
  { key: "mauricienne", label: "Créole / mauricien" },
  { key: "indienne", label: "Indien" },
  { key: "asiatique", label: "Asiatique" },
  { key: "europeenne", label: "Européen" },
  { key: "tous", label: "Peu importe" },
  { key: "aucun", label: "Pas de repas" },
];

export const PLAN_DURATIONS: { minutes: number; label: string }[] = [
  { minutes: 120, label: "2 h" },
  { minutes: 180, label: "3 h" },
  { minutes: 240, label: "4 h" },
  { minutes: 360, label: "Demi-journée+" },
  { minutes: 600, label: "Journée" },
];

const MEAL_MINUTES = 60;
/** Rayon max activité → restaurant (km, à vol d'oiseau). */
const MAX_LEG_KM = 12;
/** Vitesse moyenne retenue pour la route, en km/h, avec 1,4 de détour sur la distance à vol d'oiseau. */
const ROAD_KMH = 30;
const ROAD_DETOUR = 1.4;

/** Lit une durée en texte libre (« 2h30 », « 1 h », « 45 min », « 3-4h »). Renvoie des minutes, ou undefined. */
export function parseDurationMinutes(text?: string): number | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase().replace(",", ".");
  const hm = t.match(/(\d+(?:\.\d+)?)\s*(?:h|heure|heures)\s*(\d{1,2})?/);
  if (hm) {
    const h = parseFloat(hm[1]);
    const m = hm[2] ? parseInt(hm[2], 10) : 0;
    // « 3-4h » : on garde la borne haute, plus prudente pour tenir dans une durée max
    const range = t.match(/(\d+(?:\.\d+)?)\s*[-–à]\s*(\d+(?:\.\d+)?)\s*(?:h|heure)/);
    const hours = range ? parseFloat(range[2]) : h;
    return Math.round(hours * 60 + m);
  }
  const min = t.match(/(\d+)\s*(?:min|mn)/);
  if (min) return parseInt(min[1], 10);
  return undefined;
}

function isKidsFriendly(b: Business): boolean {
  return (
    (b.themes ?? []).some((t) => t === "kids-friendly" || t === "parcs-activites-famille" || t === "activites-enfants-famille") ||
    (b.filters ?? []).includes("kids-friendly")
  );
}

/** Fiches plus complètes d'abord (commentaire KM, photo, description) : meilleures à proposer. */
function quality(b: Business): number {
  return (b.koteMorisComment ? 3 : 0) + (b.photoUrl || b.photoUrls?.length ? 2 : 0) + (b.description ? 1 : 0);
}

function hasGps(b: Business): b is Business & { lat: number; lng: number } {
  return typeof b.lat === "number" && typeof b.lng === "number";
}

/**
 * Compose des combos « activité + restaurant proche » à partir des vraies fiches.
 * Une fiche sans donnée sur un critère n'est jamais écartée pour cette raison
 * (sauf GPS, indispensable) : on n'invente rien, on estime la durée et on le signale.
 */
export function buildPlan(businesses: Business[], c: PlanCriteria): PlanCombo[] {
  const act = PLAN_ACTIVITIES.find((a) => a.key === c.activity)!;
  const wantsMeal = c.meal !== "aucun";
  const zoneOk = (b: Business) => c.zone === "partout" || b.zone === c.zone;

  let activities = businesses.filter(
    (b) => hasGps(b) && zoneOk(b) && (b.themes ?? []).some((t) => act.themes.includes(t)),
  );
  if (c.who === "famille") {
    const kids = activities.filter(isKidsFriendly);
    // Si aucune fiche n'est marquée adaptée aux enfants pour ce choix, on n'exclut pas tout : le
    // résultat reste utile, sans prétendre que c'est adapté.
    if (kids.length > 0) activities = kids;
  }

  const restaurants = wantsMeal
    ? businesses.filter(
        (b) =>
          hasGps(b) &&
          (b.themes ?? []).includes("restaurants") &&
          (c.meal === "tous" || (b.filters ?? []).includes(c.meal)),
      )
    : [];

  const combos: PlanCombo[] = [];
  const usedRestaurants = new Set<string>();

  const sorted = [...activities].sort((a, b) => quality(b) - quality(a) || a.name.localeCompare(b.name));
  for (const a of sorted) {
    const parsed = parseDurationMinutes(a.duration);
    const activityMinutes = parsed ?? act.defaultMinutes;

    let restaurant: Business | undefined;
    let legKm: number | undefined;
    if (wantsMeal) {
      const near = restaurants
        .map((r) => ({ r, km: haversineKm(a.lat as number, a.lng as number, r.lat as number, r.lng as number) }))
        .filter((x) => x.km <= MAX_LEG_KM)
        .sort((x, y) => {
          // Préfère un resto pas déjà proposé, puis le plus complet, puis le plus proche
          const ux = usedRestaurants.has(x.r.id) ? 1 : 0;
          const uy = usedRestaurants.has(y.r.id) ? 1 : 0;
          return ux - uy || quality(y.r) - quality(x.r) || x.km - y.km;
        });
      if (near.length === 0) continue;
      restaurant = near[0].r;
      legKm = near[0].km;
    }

    const travelMinutes = legKm != null ? Math.round(((legKm * ROAD_DETOUR) / ROAD_KMH) * 60) : 0;
    const mealMinutes = wantsMeal ? MEAL_MINUTES : 0;
    const totalMinutes = activityMinutes + travelMinutes + mealMinutes;
    if (totalMinutes > c.maxMinutes) continue;
    if (restaurant) usedRestaurants.add(restaurant.id);

    combos.push({
      activity: a,
      restaurant,
      legKm,
      activityMinutes,
      activityEstimated: parsed === undefined,
      travelMinutes,
      mealMinutes,
      totalMinutes,
    });
  }
  return combos;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Minuscules, sans accents, apostrophes droites : base commune pour repérer les mots-clés. */
function norm(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’`]/g, "'");
}

const ZONE_PLACES: Record<Exclude<PlanZone, "partout">, string[]> = {
  nord: ["grand baie", "grand-baie", "pereybere", "cap malheureux", "trou aux biches", "mont choisy", "pamplemousses", "grand gaube"],
  ouest: ["flic en flac", "flic-en-flac", "le morne", "tamarin", "black river", "la gaulette", "albion", "wolmar"],
  sud: ["mahebourg", "blue bay", "souillac", "bel ombre", "chamarel", "gris gris", "riviere des anguilles", "savanne", "pointe d'esny"],
  est: ["belle mare", "trou d'eau douce", "ile aux cerfs", "poste de flacq", "roches noires", "centre de flacq"],
  centre: ["curepipe", "vacoas", "ebene", "quatre bornes", "moka", "trou aux cerfs", "phoenix"],
};

/**
 * Lit une phrase libre (« excursion en famille dans le sud avec resto créole, max 3h »)
 * et renvoie les critères reconnus. Un critère non mentionné est absent du résultat
 * (l'appelant garde alors la valeur déjà choisie) : on ne devine rien.
 */
export function parsePlanText(text: string): Partial<PlanCriteria> {
  const t = norm(text);
  const out: Partial<PlanCriteria> = {};

  if (/\b(famille|enfants?|bebes?|kids|petits)\b/.test(t)) out.who = "famille";
  else if (/\b(couple|romantique|amoureux|a deux|en duo)\b/.test(t)) out.who = "couple";
  else if (/\b(amis|potes|copains|copines|groupe|bande)\b/.test(t)) out.who = "amis";
  else if (/\b(solo|seul|seule)\b/.test(t)) out.who = "solo";

  // Zone : un mot-clé de zone, sinon un lieu connu. « sud-est » → sud (1er cité gagne).
  const zoneRegex: [PlanZone, RegExp][] = [
    ["nord", /\bnord\b/],
    ["sud", /\bsud\b/],
    ["ouest", /\bouest\b/],
    ["centre", /\bcentre\b|\bplateaux?\b/],
    ["est", /(?:\bl'|\bcote |\bregion |\bzone )est\b|\best de l'ile\b/],
  ];
  const zoneHit = zoneRegex.find(([, re]) => re.test(t));
  if (zoneHit) out.zone = zoneHit[0];
  else {
    const place = (Object.entries(ZONE_PLACES) as [Exclude<PlanZone, "partout">, string[]][]).find(([, names]) =>
      names.some((n) => t.includes(n)),
    );
    if (place) out.zone = place[0];
  }

  if (/\b(rando|randonnee|randonnees|trek|trail|marche)\b/.test(t)) out.activity = "rando";
  else if (/\b(musee|musees|culture|culturel|patrimoine|histoire|visite)\b/.test(t)) out.activity = "culture";
  else if (/\b(plage|plages|baignade|snorkeling|detente au bord)\b/.test(t)) out.activity = "plage";
  else if (/\b(parc|parcs|jardin|zoo|accrobranche|quad|activite|activites|loisirs)\b/.test(t)) out.activity = "parc";
  else if (/\b(excursion|excursions|sortie|sorties|bateau|catamaran|croisiere|balade)\b/.test(t)) out.activity = "excursion";

  if (/\b(sans repas|pas de repas|sans resto|sans restaurant|pas de resto)\b/.test(t)) out.meal = "aucun";
  else if (/\b(creole|mauricien|mauricienne|cuisine locale|locale)\b/.test(t)) out.meal = "mauricienne";
  else if (/\b(indien|indienne|curry|biryani)\b/.test(t)) out.meal = "indienne";
  else if (/\b(asiatique|chinois|chinoise|thai|thailandais|japonais|sushi)\b/.test(t)) out.meal = "asiatique";
  else if (/\b(europeen|europeenne|francais|italien|pizza|pizzeria)\b/.test(t)) out.meal = "europeenne";
  else if (/\b(resto|restos|restaurant|manger|repas|dejeuner|diner|dejeuner)\b/.test(t)) out.meal = "tous";

  // Durée : « 3h », « 2h30 », « 2 heures », « 90 min », « demi-journée », « journée ».
  const hm = t.match(/(\d+)\s*(?:h|heures?)\s*(\d{1,2})?/);
  const mn = t.match(/(\d+)\s*(?:min|minutes|mn)\b/);
  if (hm) out.maxMinutes = parseInt(hm[1], 10) * 60 + (hm[2] ? parseInt(hm[2], 10) : 0);
  else if (mn) out.maxMinutes = parseInt(mn[1], 10);
  else if (/\bdemi[- ]?journee\b/.test(t)) out.maxMinutes = 360;
  else if (/\b(journee|toute la journee)\b/.test(t)) out.maxMinutes = 600;

  return out;
}
