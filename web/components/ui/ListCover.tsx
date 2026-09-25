import { LIST_ICON_IMAGES } from "@/lib/favoriteLists";

/**
 * Couverture d'une liste personnalisée : illustration Koté Moris pour les
 * emojis suggérés, emoji brut sinon (saisie libre « Autre »), 📍 par défaut.
 * `size` = côté de l'illustration en px (l'emoji suit la taille de police du parent).
 */
export function ListCover({ emoji, size = 28 }: { emoji: string | null; size?: number }) {
  const src = emoji ? LIST_ICON_IMAGES[emoji] : undefined;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" aria-hidden width={size} height={size} className="object-contain" style={{ width: size, height: size }} />;
  }
  return <span aria-hidden>{emoji ?? "📍"}</span>;
}
