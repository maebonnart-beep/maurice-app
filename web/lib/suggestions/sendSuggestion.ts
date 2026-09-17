/** Envoie une suggestion (commentaire, adresse, contact) à l'admin par e-mail (Resend).
 *  Remplace le mailto client (ouvre l'appli mail perso puis passe par la redirection
 *  OVH contact@kotemoris.com → Gmail) : ce chemin s'est révélé peu fiable (l'utilisateur
 *  doit cliquer Envoyer manuellement, et la redirection OVH perd des messages), alors
 *  que Resend est déjà utilisé avec succès pour les autres e-mails transactionnels. */
export async function sendSuggestionEmail({
  subject,
  html,
  replyTo,
}: {
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !adminEmail) return { ok: false };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Koté Moris <notifications@kotemoris.com>",
        to: adminEmail,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("sendSuggestionEmail: Resend error", res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendSuggestionEmail: fetch failed", err);
    return { ok: false };
  }
}
