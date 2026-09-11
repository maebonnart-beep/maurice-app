import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { MAX_ACTIVE_LISTINGS } from "@/lib/marketplace/constants";

const SITE_URL = "https://kotemoris.com";

/** Rappel d'installation en PWA, commun aux deux e-mails de compte ci-dessous. */
const INSTALL_APP_HTML = `
  <p style="margin-top:24px"><strong>Astuce :</strong> installe Koté Moris sur l'écran d'accueil de ton téléphone pour y accéder comme une vraie appli (sans passer par le navigateur) :</p>
  <ul>
    <li><strong>iPhone (Safari)</strong> : bouton Partager, puis « Sur l'écran d'accueil ».</li>
    <li><strong>Android (Chrome)</strong> : menu ⋮ en haut à droite, puis « Installer l'application » (ou « Ajouter à l'écran d'accueil »).</li>
  </ul>
`;

const SITE_LINK_HTML = `<p style="margin-top:24px"><a href="${SITE_URL}">${SITE_URL}</a></p>`;

/** Encart premium mis en avant dans le mail de bienvenue, avec lien direct vers
 *  la page d'upgrade (mêmes arguments que UpgradeClient.tsx). */
const PREMIUM_UPSELL_HTML = `
  <div style="margin-top:20px;padding:16px 20px;border-radius:12px;background:#fff4e5;border:1px solid #f5c98a;">
    <p style="margin:0 0 8px;font-weight:600;">⭐ Passe premium pour débloquer :</p>
    <ul style="margin:0 0 12px;padding-left:20px;">
      <li>L'agenda complet des événements de l'île</li>
      <li>Le dépôt de tes propres annonces « Seconde main »</li>
      <li>Des alertes personnalisées sur tes thématiques favorites</li>
      <li>L'accès prioritaire aux nouvelles adresses de l'annuaire</li>
    </ul>
    <a href="${SITE_URL}/mon-compte/upgrade" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#e8890c;color:#fff;text-decoration:none;font-weight:600;">Passer premium</a>
  </div>
`;

/** Notifie un nouvel utilisateur par e-mail (Resend) lors de sa toute première connexion.
 *  Best-effort : une erreur d'envoi est loguée mais ne doit jamais faire échouer la connexion. */
export async function sendWelcomeEmail(toEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

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
        subject: "Bienvenue sur Koté Moris 👋",
        html: `
          <p>Bienvenue sur Koté Moris, l'annuaire et le guide de l'île Maurice !</p>
          <p>Avec ton compte, tu peux dès maintenant :</p>
          <ul>
            <li>Explorer tout l'annuaire, par recherche libre ou par catégorie</li>
            <li>Enregistrer tes adresses préférées en favoris</li>
            <li>Parcourir les Sélections Koté Moris</li>
            <li>Consulter les annonces « Seconde main entre particuliers »</li>
            <li>Partager tes bonnes adresses</li>
          </ul>
          ${PREMIUM_UPSELL_HTML}
          <p style="margin-top:20px">Tu as repéré une adresse manquante, une erreur sur une fiche, ou une idée pour améliorer le site ? Écris-nous à <a href="mailto:contact@kotemoris.com">contact@kotemoris.com</a>, on adore avoir des nouvelles de la communauté.</p>
          ${INSTALL_APP_HTML}
          ${SITE_LINK_HTML}
        `,
      }),
    });
    if (!res.ok) {
      console.error("sendWelcomeEmail: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("sendWelcomeEmail: fetch failed", err);
  }
}

/** Envoie le mail de bienvenue une seule fois (au tout premier login) : lit et pose
 *  le flag `profiles.welcome_email_sent_at` avec le client passé en argument (donc
 *  soumis à sa RLS — appeler avec un client lié à la session de l'utilisateur, ou
 *  service-role). Best-effort, ne throw jamais. */
export async function sendWelcomeEmailOnce(supabase: SupabaseClient, user: User) {
  if (!user.email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("welcome_email_sent_at")
    .eq("id", user.id)
    .single();
  if (!profile || profile.welcome_email_sent_at) return;

  await sendWelcomeEmail(user.email);
  await supabase.from("profiles").update({ welcome_email_sent_at: new Date().toISOString() }).eq("id", user.id);
}

/** Notifie un utilisateur par e-mail (Resend) que son abonnement premium est actif.
 *  Best-effort : une erreur d'envoi est loguée mais ne doit jamais faire échouer le webhook Stripe. */
export async function sendUpgradeEmail(toEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

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
        subject: "Ton abonnement premium est actif 🎉",
        html: `
          <p>Merci, ton abonnement premium Koté Moris est bien actif !</p>
          <p>Tu as maintenant accès à :</p>
          <ul>
            <li>Jusqu'à ${MAX_ACTIVE_LISTINGS} annonces actives sur « Seconde main entre particuliers », avec contact direct par WhatsApp avec les acheteurs</li>
            <li>L'accès complet aux événements de l'île</li>
            <li>Des alertes personnalisées sur tes thématiques favorites</li>
            <li>Les nouvelles adresses de l'annuaire en avant-première</li>
          </ul>
          <p><a href="${SITE_URL}/mon-compte">Gérer mon compte</a></p>
          ${INSTALL_APP_HTML}
          ${SITE_LINK_HTML}
        `,
      }),
    });
    if (!res.ok) {
      console.error("sendUpgradeEmail: Resend error", res.status, await res.text());
    }
  } catch (err) {
    console.error("sendUpgradeEmail: fetch failed", err);
  }
}
