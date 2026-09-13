// Interprète le champ `hours` (texte libre en français, formats très variés
// saisis à la main) pour déterminer si une fiche est ouverte à un instant donné.
// Best-effort : ~94% des formats rencontrés dans businesses.json sont reconnus ;
// les formats non reconnus (visites guidées à horaire fixe, "sur réservation",
// "à partir de"...) retournent "unknown" plutôt qu'un faux "fermé".

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Lun..Dim, ordre d'affichage FR

const DAY_TOKENS: [string, number][] = [
  ["dimanche", 0], ["lundi", 1], ["mardi", 2], ["mercredi", 3], ["jeudi", 4], ["vendredi", 5], ["samedi", 6],
  ["dim", 0], ["lun", 1], ["mar", 2], ["mer", 3], ["jeu", 4], ["ven", 5], ["sam", 6],
  ["ma", 2], ["je", 4],
];

type Ranges = [number, number][];

interface ParsedHours {
  schedule: Map<number, Ranges>;
  closedDays: Set<number>;
}

function normalize(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function timeToken(tok: string): number | null {
  const t = tok.trim();
  if (t === "minuit") return 24 * 60;
  if (t === "midi") return 12 * 60;
  const m = t.match(/^(\d{1,2})[h:](\d{2})?$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
}

function parseDaySpec(fragment: string): number[] | null {
  const frag = fragment.trim();
  if (!frag) return null;
  const rangeMatch = frag.match(/^([a-z]+)-([a-z]+)$/);
  if (rangeMatch) {
    const a = DAY_TOKENS.find(([k]) => k === rangeMatch[1]);
    const b = DAY_TOKENS.find(([k]) => k === rangeMatch[2]);
    if (a && b) {
      const ia = WEEK_ORDER.indexOf(a[1]);
      const ib = WEEK_ORDER.indexOf(b[1]);
      const days: number[] = [];
      let i = ia;
      while (true) {
        days.push(WEEK_ORDER[i]);
        if (i === ib) break;
        i = (i + 1) % 7;
      }
      return days;
    }
  }
  const parts = frag.split(/[/,]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    const days: number[] = [];
    for (const p of parts) {
      const found = DAY_TOKENS.find(([k]) => k === p);
      if (!found) return null;
      days.push(found[1]);
    }
    if (days.length > 0) return days;
  }
  return null;
}

function extractLeadingDays(segment: string): { days: number[]; rest: string } | null {
  const s = segment.trim();
  if (/^(tous les jours|tlj)\b/.test(s)) {
    return { days: [0, 1, 2, 3, 4, 5, 6], rest: s.replace(/^(tous les jours|tlj)\b/, "").trim() };
  }
  const rangeM = s.match(/^([a-z]{2,9})\s*-\s*([a-z]{2,9})\b/);
  if (rangeM) {
    const days = parseDaySpec(`${rangeM[1]}-${rangeM[2]}`);
    if (days) return { days, rest: s.slice(rangeM[0].length).trim() };
  }
  const listM = s.match(/^((?:[a-z]{2,9}\s*\/\s*)+[a-z]{2,9})\b/);
  if (listM) {
    const days = parseDaySpec(listM[1].replace(/\s+/g, ""));
    if (days) return { days, rest: s.slice(listM[0].length).trim() };
  }
  const singleM = s.match(/^([a-z]{2,9})\b/);
  if (singleM) {
    const found = DAY_TOKENS.find(([k]) => k === singleM[1]);
    if (found) return { days: [found[1]], rest: s.slice(singleM[0].length).trim() };
  }
  return null;
}

const TIME = "\\d{1,2}(?:h\\d{0,2}|:\\d{2})|minuit|midi";

function parseTimeRanges(fragment: string): Ranges | null {
  const parts = fragment.split(/\bet\b|&/i).map((p) => p.trim()).filter(Boolean);
  const ranges: Ranges = [];
  for (const p of parts) {
    const m = p.match(new RegExp(`(${TIME})\\s*-\\s*(${TIME})`));
    if (!m) continue;
    const start = timeToken(m[1]);
    let end = timeToken(m[2]);
    if (start === null || end === null) continue;
    if (end <= start) end += 24 * 60; // passe minuit
    ranges.push([start, end]);
  }
  return ranges.length > 0 ? ranges : null;
}

function parseHours(raw: string): ParsedHours | null {
  const norm = normalize(raw);
  if (/24h\s*\/\s*24/.test(norm)) {
    const schedule = new Map<number, Ranges>();
    [0, 1, 2, 3, 4, 5, 6].forEach((d) => schedule.set(d, [[0, 24 * 60]]));
    return { schedule, closedDays: new Set() };
  }

  const schedule = new Map<number, Ranges>();
  const closedDays = new Set<number>();
  let matchedAny = false;

  const semiParts = norm.split(";").map((p) => p.trim()).filter(Boolean);
  for (const semiPart of semiParts) {
    const closedRegex = /ferm[ee]?\s*(?:le\s+|la\s+)?([a-z/\-,\s]+?)(?=$|\(|\.|,\s*(?:et\s+)?jours\s+feri|;)/g;
    let cm: RegExpExecArray | null;
    let withoutClosed = semiPart;
    while ((cm = closedRegex.exec(semiPart)) !== null) {
      const daySpecStr = cm[1].trim();
      const subDayParts = daySpecStr.split(",").map((x) => x.trim()).filter(Boolean);
      for (const sdp of subDayParts) {
        const days = parseDaySpec(sdp.replace(/\s+/g, ""));
        if (days) {
          days.forEach((d) => closedDays.add(d));
          matchedAny = true;
        }
      }
      withoutClosed = withoutClosed.replace(cm[0], " ");
    }

    const commaParts = withoutClosed.split(",").map((p) => p.trim()).filter(Boolean);
    let pendingDays: number[] = [];
    for (const part of commaParts) {
      const hasTime = /\d{1,2}(?:h\d{0,2}|:\d{2})|minuit|midi/.test(part);
      const leading = extractLeadingDays(part);
      if (!hasTime) {
        if (leading) pendingDays.push(...leading.days);
        else {
          const days = parseDaySpec(part.replace(/\s+/g, ""));
          if (days) pendingDays.push(...days);
        }
        continue;
      }
      let days: number[];
      let timeFragment: string;
      if (leading) {
        days = [...pendingDays, ...leading.days];
        timeFragment = leading.rest;
      } else {
        days = pendingDays.length > 0 ? pendingDays : [0, 1, 2, 3, 4, 5, 6];
        timeFragment = part;
      }
      pendingDays = [];
      const ranges = parseTimeRanges(timeFragment);
      if (ranges) {
        matchedAny = true;
        for (const d of days) {
          if (!schedule.has(d)) schedule.set(d, []);
          schedule.get(d)!.push(...ranges);
        }
      }
    }
  }

  if (!matchedAny) return null;
  return { schedule, closedDays };
}

export type OpenState = "open" | "closed" | "unknown";

// Détermine si une fiche est ouverte à l'instant `at` d'après son champ `hours`.
// "unknown" = horaires absents ou dans un format qu'on ne sait pas interpréter
// (ex. "sur réservation", "à partir de 18h") — jamais traité comme fermé.
export function openStateAt(hours: string | undefined, at: Date): OpenState {
  if (!hours) return "unknown";
  const parsed = parseHours(hours);
  if (!parsed) return "unknown";

  const dow = at.getDay();
  const minutesNow = at.getHours() * 60 + at.getMinutes();
  const prevDow = (dow + 6) % 7;

  if (!parsed.closedDays.has(dow)) {
    const todayRanges = parsed.schedule.get(dow) || [];
    for (const [s, e] of todayRanges) {
      if (minutesNow >= s && minutesNow < Math.min(e, 24 * 60)) return "open";
    }
  }
  if (!parsed.closedDays.has(prevDow)) {
    const prevRanges = parsed.schedule.get(prevDow) || [];
    for (const [s, e] of prevRanges) {
      if (e > 24 * 60 && minutesNow < e - 24 * 60) return "open";
    }
  }
  if (parsed.schedule.size === 0 && parsed.closedDays.size === 0) return "unknown";
  return "closed";
}

// Pour le filtre "ouvert maintenant" : on inclut tout ce qui n'est pas
// confirmé fermé (fiches sans horaires ou horaires illisibles incluses).
export function matchesOpenNow(hours: string | undefined, at: Date = new Date()): boolean {
  return openStateAt(hours, at) !== "closed";
}
