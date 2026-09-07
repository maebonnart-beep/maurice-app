import type { CategoryKey } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { iconForKey } from "@/lib/icons";

// Couleurs d'accent des badges spéciaux — partagées avec l'accent latéral des fiches.
export const COUP_DE_COEUR_COLOR = "#ff2d6a";
export const SELECTION_COLOR = "#7c3aed";
export const AGENCY_COLOR = "#6366f1";

/** Badge de catégorie : pastille pleine colorée à la couleur de la catégorie. */
export function CategoryBadge({ category }: { category: CategoryKey }) {
  const cat = CATEGORY_MAP[category];
  const Icon = iconForKey(category);
  return (
    <span
      className="self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-white text-xs font-bold"
      style={{ background: cat.color }}
    >
      {Icon ? <Icon size={13} weight="bold" aria-hidden /> : cat.emoji} {cat.label}
    </span>
  );
}

export type SpecialBadgeVariant = "partenaire" | "selection" | "kids-friendly" | "agence";

/** Nature du prestataire (soutien scolaire, cours de langues) : prof particulier, organisme, ou application mobile. */
export const PROVIDER_TYPE_INFO: Record<
  "particulier" | "organisme" | "application",
  { emoji: string; label: string; color: string }
> = {
  particulier: { emoji: "🧑‍🏫", label: "Prof particulier", color: "#0891b2" },
  organisme: { emoji: "🏢", label: "Organisme", color: AGENCY_COLOR },
  application: { emoji: "📱", label: "Application", color: "#059669" },
};

/** Pastille indiquant si une fiche est un prof particulier, un organisme, ou une application. */
export function ProviderTypeBadge({
  type,
  className,
}: {
  type: "particulier" | "organisme" | "application";
  className?: string;
}) {
  const info = PROVIDER_TYPE_INFO[type];
  return (
    <span
      className={
        className ??
        "self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-white text-xs font-bold"
      }
      style={{ background: info.color }}
    >
      {info.emoji} {info.label}
    </span>
  );
}

/** Badges de mise en avant (Partenaire, Sélection, Agence organisatrice). */
export function SpecialBadge({ variant, className }: { variant: SpecialBadgeVariant; className?: string }) {
  if (variant === "partenaire") {
    return (
      <span className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-on-accent text-xs font-bold bg-accent">
        ⭐ Partenaire
      </span>
    );
  }
  if (variant === "selection") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/badge-selection.png" alt="Sélection Koté Moris" title="Sélection Koté Moris" className={className ?? "self-start h-12 w-12 shrink-0"} />
    );
  }
  if (variant === "kids-friendly") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/badge-kids.png" alt="Kids Friendly" title="Kids Friendly" className={className ?? "self-start h-12 w-12 shrink-0"} />
    );
  }
  // agence
  return (
    <span
      className="self-start inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-white text-xs font-bold"
      style={{ background: AGENCY_COLOR }}
    >
      🏢 Agence organisatrice
    </span>
  );
}

/** Couleur d'accent latéral d'une fiche selon son badge / statut d'agence. */
export function accentColorFor(
  badge?: "partenaire" | "selection",
  isAgency?: boolean
): string | undefined {
  if (badge === "selection") return SELECTION_COLOR;
  if (badge === "partenaire") return "var(--accent)";
  if (isAgency) return AGENCY_COLOR;
  return undefined;
}
