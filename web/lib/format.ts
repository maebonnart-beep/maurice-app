import type { Business } from "@/lib/types";

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

// Les numéros mobiles mauriciens (+230 5xxx xxxx) sont presque toujours
// joignables sur WhatsApp, contrairement aux lignes fixes.
export const MU_MOBILE_RE = /\+230\s?5\d{3}\s?\d{4}/;

export function whatsappNumber(b: Business): string | undefined {
  if (b.whatsapp) return b.whatsapp;
  if (b.phone && MU_MOBILE_RE.test(b.phone)) return b.phone;
  return undefined;
}
