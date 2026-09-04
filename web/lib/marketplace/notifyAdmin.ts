/** Notifie l'admin par e-mail (Resend) qu'une nouvelle annonce attend une validation.
 *  Best-effort : une erreur d'envoi est loguée mais ne doit jamais faire échouer
 *  le dépôt d'annonce lui-même. */
export async function notifyAdminNewListing(listing: { id: number; title: string; whatsapp: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !adminEmail) return;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Maurice+ <onboarding@resend.dev>",
        to: adminEmail,
        subject: `Nouvelle annonce à valider : ${listing.title}`,
        html: `<p>Une nouvelle annonce « ${listing.title} » (WhatsApp ${listing.whatsapp}) attend une validation.</p><p><a href="https://web-ten-khaki-70.vercel.app/admin/seconde-main">Voir dans la modération</a></p>`,
      }),
    });
    if (!res.ok) {
      console.error("notifyAdminNewListing: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyAdminNewListing: fetch failed", err);
  }
}
