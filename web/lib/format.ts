import type { Business } from "@/lib/types";
import { CATEGORIES } from "@/data/categories";

// Utilitaires de formatage partagés entre la liste (DirectoryClient) et la carte (Map).

export function tel(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

// Corrige les noms saisis TOUT EN MAJUSCULES : ne touche que les mots
// entièrement en capitales, laisse les noms déjà bien casés intacts.
export function displayName(name: string): string {
  return name.replace(/\p{L}+/gu, (word) => {
    if (word.length > 1 && word === word.toUpperCase() && word !== word.toLowerCase()) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });
}

// N'affiche que la ville : dernier segment de l'adresse, sans coordonnées
// GPS ni code postal.
export function displayCity(address: string): string {
  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && !/^-?\d{1,3}\.\d+$/.test(s));
  const last = parts[parts.length - 1] || address;
  return last.replace(/\s+\d{4,6}$/, "").trim();
}

export function webLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

export function whatsappLink(phone: string): string {
  return "https://wa.me/" + phone.replace(/[^\d]/g, "");
}

export const KOTE_MORIS_URL = "https://kotemoris.com";

// Message pré-rempli global pour tout bouton "Contacter" (WhatsApp/email) :
// signale à l'interlocuteur que la démarche vient de Koté Moris.
function contactMessage(): string {
  return `Bonjour, je vous contacte via Koté Moris — ${KOTE_MORIS_URL}`;
}

// Accroche commune à tout partage (fiche ou liste d'adresses) : le lien est
// accolé au nom "Koté Moris" pour servir de lien cliquable sur ce nom.
export function shareTagline(): string {
  return `📍 Partagé depuis Koté Moris 🇲🇺 (${KOTE_MORIS_URL})\nL'annuaire qui vous aide à trouver votre prochaine bonne adresse`;
}

export function whatsappContactLink(phone: string): string {
  return whatsappLink(phone) + "?text=" + encodeURIComponent(contactMessage());
}

export function emailContactHref(email: string): string {
  const subject = "Contact via Koté Moris";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(contactMessage())}`;
}

// Les numéros mobiles mauriciens (+230 5xxx xxxx) sont presque toujours
// joignables sur WhatsApp, contrairement aux lignes fixes.
export const MU_MOBILE_RE = /\+230\s?5\d{3}\s?\d{4}/;

export function whatsappNumber(b: Business): string | undefined {
  if (b.whatsapp) return b.whatsapp;
  if (b.phone && MU_MOBILE_RE.test(b.phone)) return b.phone;
  return undefined;
}

const ZONE_PHRASES: Record<string, string> = {
  nord: "dans le nord de l'île",
  sud: "dans le sud de l'île",
  est: "dans l'est de l'île",
  ouest: "dans l'ouest de l'île",
  centre: "dans le centre de l'île",
};

/**
 * Phrase "À propos" de repli, construite à partir des champs structurés déjà
 * présents (rubrique, ville, zone) — jamais de donnée inventée — pour que le
 * bloc "À propos" garde toujours la même place dans le gabarit (liste et
 * fiche détail), même sur les fiches sans descriptif rédigé (ex: tout juste
 * suggérées via le formulaire, avant relecture/enrichissement éditorial).
 */
export function fallbackDescription(b: Business, rubriqueLabel: string | undefined): string {
  const what = rubriqueLabel ?? CATEGORIES.find((c) => c.key === b.category)?.label ?? "Adresse";
  const city = displayCity(b.address);
  const zonePhrase = b.zone ? ZONE_PHRASES[b.zone] : undefined;
  const where = [city, zonePhrase].filter(Boolean).join(", ");
  return where ? `${what} à ${where}.` : `${what}.`;
}
