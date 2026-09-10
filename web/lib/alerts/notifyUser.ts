const SITE_URL = "https://web-ten-khaki-70.vercel.app";

export type AlertMatch = { title: string; href?: string; subtitle?: string };

function itemsListHtml(matches: AlertMatch[]): string {
  return matches
    .map((m) => {
      const label = m.href ? `<a href="${SITE_URL}${m.href}">${m.title}</a>` : m.title;
      return `<li>${label}${m.subtitle ? ` — ${m.subtitle}` : ""}</li>`;
    })
    .join("");
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

  const sections = [
    params.matches.length > 0
      ? `<p>Nouveau depuis ta dernière alerte « ${params.alertLabel} » :</p><ul>${itemsListHtml(params.matches)}</ul>`
      : "",
    reminders.length > 0
      ? `<p>⏰ Dans 7 jours ou moins :</p><ul>${itemsListHtml(reminders)}</ul>`
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
        html: `${sections}<p><a href="${SITE_URL}/mon-compte/alertes">Gérer mes alertes</a></p>`,
      }),
    });
    if (!res.ok) {
      console.error("notifyUserAlertMatches: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyUserAlertMatches: fetch failed", err);
  }
}
