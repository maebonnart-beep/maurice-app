import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { SUBCATEGORIES, FILTER_GROUPS } from "@/data/categories";
import type { SavedSearchCriteria, SavedSearchType, ListingSearchCriteria, EventSearchCriteria } from "./types";

const ZONE_LABELS: Record<string, string> = {
  nord: "Nord",
  sud: "Sud",
  est: "Est",
  ouest: "Ouest",
  centre: "Centre",
};

const RUBRIQUE_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(SUBCATEGORIES)
    .flat()
    .map((s) => [s!.key, s!.label])
);

const FILTER_OPTION_LABELS: Record<string, string> = Object.fromEntries(
  FILTER_GROUPS.flatMap((g) => g.options.map((o) => [o.key, o.label]))
);

/** Libellé lisible d'une alerte, généré à partir de ses critères (ex. "Meubles · Nord"). */
export function describeCriteria(type: SavedSearchType, criteria: SavedSearchCriteria): string {
  if (type === "listing") {
    const c = criteria as ListingSearchCriteria;
    const parts = [
      c.category ? LISTING_CATEGORIES.find((cat) => cat.key === c.category)?.label : null,
      c.zone ? ZONE_LABELS[c.zone] : null,
      c.maxPrice ? `Rs ${c.maxPrice.toLocaleString("fr-FR")} max` : null,
      c.keyword ? `« ${c.keyword} »` : null,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "Toutes les annonces";
  }

  const c = criteria as EventSearchCriteria;
  const parts = [
    ...(c.themes ?? []).map((t) => RUBRIQUE_LABELS[t] ?? t),
    ...(c.filters ?? []).map((f) => FILTER_OPTION_LABELS[f] ?? f),
    c.keyword ? `« ${c.keyword} »` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Tous les événements";
}
