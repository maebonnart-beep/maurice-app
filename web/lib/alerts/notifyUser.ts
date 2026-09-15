const SITE_URL = "https://kotemoris.com";
const LOGO_URL = `${SITE_URL}/logo-octopus.png`;
const EVENT_LOGO_URL = `${SITE_URL}/logo-alerte-evenements.png`;

export type AlertMatch = { title: string; href?: string; subtitle?: string; theme?: string };

function itemsListHtml(matches: AlertMatch[]): string {
  return matches
    .map((m) => {
      const label = m.href ? `<a href="${SITE_URL}${m.href}">${m.title}</a>` : m.title;
      return `<li>${label}${m.subtitle ? ` — ${m.subtitle}` : ""}</li>`;
    })
    .join("");
}

/** Regroupe les événements par thématique (rubrique agenda), dans l'ordre de première
 *  apparition — qui suit l'ordre chronologique puisque `matches` est déjà trié par date
 *  avant l'appel. Les fiches sans thème identifié atterrissent dans un groupe "Autres". */
function eventSectionsHtml(matches: AlertMatch[]): string {
  const groups = new Map<string, AlertMatch[]>();
  for (const m of matches) {
    const key = m.theme ?? "Autres";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  return [...groups.entries()]
    .map(
      ([theme, items]) =>
        `<p style="margin:12px 0 2px;font-weight:bold;color:#0f766e;">${theme}</p><ul style="margin:0 0 8px;">${itemsListHtml(items)}</ul>`
    )
    .join("");
}

/** En-tête commun (logo) et bouton d'appel à l'action vers l'appli, pour garder
 *  les e-mails d'alerte reconnaissables et toujours reliés à Koté Moris. */
function emailHeaderHtml(type: "listing" | "event"): string {
  const logo = type === "event" ? EVENT_LOGO_URL : LOGO_URL;
  return `<div style="text-align:center;margin-bottom:16px;"><img src="${logo}" alt="Koté Moris" width="${type === "event" ? 88 : 64}" height="${type === "event" ? 88 : 64}" style="display:inline-block;" /></div>`;
}

function ctaButtonHtml(href: string, label: string): string {
  return `<p style="text-align:center;margin:24px 0;"><a href="${href}" style="background:#14b8a6;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">${label}</a></p>`;
}

/** Notifie un utilisateur par e-mail (Resend) que son alerte a de nouveaux résultats,
 *  et/ou (pour les événements) un rappel à J-7 pour des fiches déjà signalées.
 *  Best-effort : une erreur d'envoi est loguée mais ne doit jamais faire échouer le cron. */
export async function notifyUserAlertMatches(params: {
  toEmail: string;
  alertLabel: string;
  type: "listing" | "event";
  matches: AlertMatch[];
  reminders?: AlertMatch[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const noun = params.type === "listing" ? "annonce(s)" : "événement(s)";
  const reminders = params.reminders ?? [];
  const totalCount = params.matches.length + reminders.length;
  const hook =
    params.type === "listing"
      ? `Ça bouge du côté de ton alerte « ${params.alertLabel} » 🐙`
      : `Ça se prépare du côté de ton alerte « ${params.alertLabel} » 🐙`;

  const isEvent = params.type === "event";
  const sections = [
    params.matches.length > 0
      ? `<p>Nouveau depuis ta dernière alerte :</p>${isEvent ? eventSectionsHtml(params.matches) : `<ul>${itemsListHtml(params.matches)}</ul>`}`
      : "",
    reminders.length > 0
      ? `<p>⏰ Dans 7 jours ou moins :</p>${isEvent ? eventSectionsHtml(reminders) : `<ul>${itemsListHtml(reminders)}</ul>`}`
      : "",
  ].join("");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Koté Moris <notifications@kotemoris.com>",
        to: params.toEmail,
        subject: `${totalCount} ${noun} pour ton alerte « ${params.alertLabel} »`,
        html: `${emailHeaderHtml(params.type)}<p style="font-size:16px;font-weight:bold;">${hook}</p>${sections}${ctaButtonHtml(`${SITE_URL}/mon-compte/alertes`, "Gérer mes alertes")}<p style="text-align:center;font-size:13px;color:#888;">Chaque événement ci-dessus est cliquable, ou <a href="${SITE_URL}">retrouve toutes les fiches sur Koté Moris</a>.</p>`,
      }),
    });
    if (!res.ok) {
      console.error("notifyUserAlertMatches: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyUserAlertMatches: fetch failed", err);
  }
}

/** Notifie un compte premium par e-mail (Resend) qu'une ou plusieurs nouvelles
 *  fiches viennent d'être ajoutées à l'annuaire. Broadcast (pas lié à une alerte
 *  utilisateur), déclenché par le cron notify-new-businesses.
 *  Best-effort : une erreur d'envoi est loguée mais ne doit jamais faire échouer le cron. */
export async function notifyNewBusinesses(toEmail: string, matches: AlertMatch[]) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || matches.length === 0) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Koté Moris <notifications@kotemoris.com>",
        to: toEmail,
        subject: `${matches.length} nouvelle${matches.length > 1 ? "s" : ""} adresse${matches.length > 1 ? "s" : ""} sur Koté Moris`,
        html: `${emailHeaderHtml("listing")}<p style="font-size:16px;font-weight:bold;">On vient de repérer de nouvelles adresses rien que pour toi 🐙</p><p>En avant-première (avantage premium), les dernières adresses ajoutées à l'annuaire :</p><ul>${itemsListHtml(matches)}</ul>${ctaButtonHtml(SITE_URL, "Découvrir sur Koté Moris")}`,
      }),
    });
    if (!res.ok) {
      console.error("notifyNewBusinesses: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyNewBusinesses: fetch failed", err);
  }
}
