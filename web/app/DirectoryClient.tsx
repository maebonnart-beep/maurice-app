"use client";

import { Fragment, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Business, CategoryKey } from "@/lib/types";
import type { MapBounds } from "./Map";
import { CATEGORIES, CATEGORY_MAP, SUBCATEGORIES, FILTER_GROUPS, PRICE_RANGES } from "@/data/categories";
import type { FilterGroup } from "@/data/categories";
import { SELECTIONS, SELECTION_GROUP_META } from "@/data/selections";
import type { SelectionGroup, SelectionIconKey } from "@/data/selections";
import { fuzzyMatchTokens, tokenize, normalizeText } from "@/lib/fuzzyMatch";
import { SEARCH_SYNONYMS } from "@/lib/searchSynonyms";
import { isPastEvent, compareByEventDate } from "@/lib/events";
import { matchesOpenNow } from "@/lib/openHours";
import { haversineKm } from "@/lib/geo";

const SELECTION_ICONS: Record<SelectionIconKey, Icon> = {
  CloudRain,
  Users,
  PiggyBank,
  Heart,
  Martini,
  MoonStars,
  SunHorizon,
  Lightning,
  ForkKnife,
  Basket,
  Camera,
  Waves,
  Leaf,
  Binoculars,
  Compass,
  Mountains,
  Wind,
  TreePalm,
  Sparkle,
  BookOpen,
  Car,
  Backpack,
  PersonSimpleWalk,
  Package,
};
import { Logo } from "@/components/ui/Logo";
import { SearchInput } from "@/components/ui/SearchInput";
import { CategoryRow } from "@/components/ui/CategoryRow";
import { BusinessCard } from "@/components/ui/BusinessCard";
import { BusinessDetail } from "@/components/ui/BusinessDetail";
import { ContactUsButton } from "@/components/ui/ContactUsButton";
import { useFavorites, type FavoriteStatus } from "@/lib/favorites";
import { useFavoriteSelections } from "@/lib/favoriteSelections";
import { usePreferences } from "@/lib/preferences";
import { usePreferencesSync } from "@/lib/preferencesSync";
import { useFavoritesSync } from "@/lib/favoritesSync";
import { useAccount } from "@/lib/marketplace/useAccount";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PREMIUM_PRICE_LABEL, MAX_ACTIVE_LISTINGS, listingPhotoUrl } from "@/lib/marketplace/constants";
import type { Listing } from "@/lib/marketplace/types";
import { COUP_DE_COEUR_COLOR, KIDS_COLOR, SELECTION_COLOR, SpecialBadge } from "@/components/ui/Badge";
import { CriteriaFlowers } from "@/components/ui/FrangipaniRating";
import { highlightedCriteria } from "@/lib/rating";

// Couleur dédiée au bandeau « Adresses kids friendly » (accueil) : vert
// émeraude, distinct du turquoise des coups de cœur mais dans la même
// famille vert-turquoise que le bandeau du haut (pas de rose, pas de bleu).
const KIDS_FRIENDLY_COLOR = "#3aa876";
// Encadrement du bandeau « coups de cœur » à l'accueil : turquoise repris du
// lagon du bandeau du haut (au lieu du rose de COUP_DE_COEUR_COLOR, utilisé
// ailleurs pour le badge « sélection »).
const COUPS_DE_COEUR_FRAME_COLOR = "#1fb6ab";

// Contour « vagues » des bandeaux éditoriaux de l'accueil (coups de cœur,
// kids friendly) : un motif ondulé par bord (dessiné indépendamment en haut/
// bas/gauche/droite) via border-image, plutôt qu'un trait plein — clin d'œil
// à l'univers plage/lagon. Contrainte connue : border-image ignore le
// border-radius, donc ces bandeaux perdent leurs coins arrondis.
function wavyFrameBorder(color: string) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><g fill='none' stroke='${color}' stroke-width='4' stroke-linecap='round'><path d='M0,12 Q12.5,3 25,12 T50,12 T75,12 T100,12'/><path d='M0,88 Q12.5,97 25,88 T50,88 T75,88 T100,88'/><path d='M12,0 Q3,12.5 12,25 T12,50 T12,75 T12,100'/><path d='M88,0 Q97,12.5 88,25 T88,50 T88,75 T88,100'/></g></svg>`;
  return {
    borderWidth: "5px",
    borderStyle: "solid",
    borderImageSource: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    borderImageSlice: 20,
    borderImageRepeat: "round",
  } as const;
}
import { FilterDropdown, type DropdownOption } from "@/components/ui/FilterDropdown";
import { AddAddressForm } from "@/components/ui/AddAddressForm";
import { iconForKey, mascotFor, prefIconFor, MapPin } from "@/lib/icons";
import { displayName, displayCity, shareTagline } from "@/lib/format";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { MyListsStrip } from "@/components/ui/MyListsStrip";
import { AddToListBanner } from "@/components/ui/AddToListBanner";
import { useFavoriteLists } from "@/lib/useFavoriteLists";
import { BannerBackdrop } from "@/components/ui/BannerBackdrop";
import { koteMorisLevel, isEditorialPick } from "@/lib/rating";
import {
  Heart,
  Flag,
  CheckCircle,
  Star,
  ArrowLeft,
  House,
  Compass,
  Plus,
  UserCircle,
  CloudRain,
  Users,
  PiggyBank,
  Martini,
  MoonStars,
  SunHorizon,
  Lightning,
  ForkKnife,
  Basket,
  Camera,
  Waves,
  Leaf,
  Binoculars,
  Mountains,
  Wind,
  TreePalm,
  Sparkle,
  DownloadSimple,
  UploadSimple,
  BookOpen,
  Car,
  Backpack,
  PersonSimpleWalk,
  Storefront,
  BellRinging,
  MagnifyingGlass,
  ShieldCheck,
  Package,
  Crown,
  Clock,
  CalendarBlank,
  Lock,
  MapTrifold,
  ListBullets,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

// Badges → facette « Sélection » (coups de cœur, recommandations & kids friendly),
// toutes rubriques. « kids-friendly » n'est pas un badge à proprement parler
// (c'est un thème dans b.themes) mais partage la même facette multi-sélection
// pour permettre reco / kids friendly / les deux en un clic.
const BADGE_META: { key: string; label: string; emoji: string }[] = [
  { key: "selection", label: "Sélection Koté Moris", emoji: "🏅" },
  { key: "partenaire", label: "Partenaire", emoji: "⭐" },
  { key: "kids-friendly", label: "Kids friendly", emoji: "🧒" },
];
// « selection » et « kids-friendly » ont un visuel de badge dédié (image ronde)
// affiché en chip cliquable dans la barre de filtres plutôt que dans le menu
// déroulant « Sélection » — cf. imageBadges dans le composant.
const IMAGE_BADGE_KEYS = new Set(["selection", "kids-friendly"]);

// Accueil → bandeau « Seconde main » : visuels d'illustration (objets génériques, Pexels
// libre de droits) utilisés tant qu'il n'y a pas assez de vraies annonces avec photo.
const SECONDE_MAIN_ILLUSTRATIONS = [
  "https://images.pexels.com/photos/18953479/pexels-photo-18953479.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/7480783/pexels-photo-7480783.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/32046500/pexels-photo-32046500.jpeg?auto=compress&cs=tinysrgb&w=400",
  "https://images.pexels.com/photos/37585377/pexels-photo-37585377.jpeg?auto=compress&cs=tinysrgb&w=400",
];

const UNCLASSIFIED = "__unclassified__";
const SIDEBAR_VISIBLE_RUBRIQUES = 5;

// Catégories/rubriques réservées aux membres Premium (aperçu verrouillé).
// « evenements » → « agenda » (verrou de catégorie entière, inchangé).
// « seconde-main » n'est plus une catégorie mais 2 rubriques dans « acheter-equiper »
// (seconde-main-boutiques / seconde-main-particuliers) → verrou au niveau rubrique.
const PREMIUM_CATEGORY_KEYS = new Set<CategoryKey>(["agenda"]);
const PREMIUM_RUBRIQUE_KEYS = new Set<string>(["seconde-main-particuliers"]);

// Accueil → grille « Explorer par catégorie » : seulement les rubriques du
// quotidien les plus courantes (le reste, dont Événements/Famille & Travail,
// reste accessible via « Voir toutes »). Événements et Seconde main ont leur
// propre raccourci VIP juste en dessous (cf. PREMIUM_CATEGORY_KEYS).
const COMMON_HOME_CATEGORIES = CATEGORIES.filter((c) =>
  ["manger-boire", "sortir-decouvrir", "faire-du-sport", "sante-bien-etre", "acheter-equiper", "vie-pratique"].includes(c.key)
);

// Écran « Explorer par catégorie » : visuel unique (planche fournie par la
// cliente), recadré pour ne garder que les 9 lignes catégories — sans
// l'encart de titre du haut ni le bandeau de fin, et resserré horizontalement
// (moins de photo à droite) pour qu'une fois étiré en pleine largeur l'image
// paraisse plus haute/grande (cf. public/explorer-categories-rows.webp,
// recadrage de explorer-categories.webp : x=32-832, y=144-1437 sur les
// 1024×1536 d'origine ; 832 garde les mascottes entières). Chaque ligne est
// cliquable via une zone invisible positionnée en % sur l'image (verticales
// uniquement, donc inchangées par le recadrage horizontal) — image 800×1293.
const EXPLORER_CATEGORIES_HOTSPOTS: { key: CategoryKey | "seconde-main"; label: string; top: number; height: number; color: string; sub: string }[] = [
  { key: "manger-boire", label: "Manger & boire", top: 0, height: 10.7, color: "#E8743B", sub: "Restaurants, cafés, bars" },
  { key: "sortir-decouvrir", label: "Sortir & découvrir", top: 11.1, height: 10.7, color: "#D8497A", sub: "Plages, visites, excursions" },
  { key: "faire-du-sport", label: "Faire du sport", top: 22.5, height: 10.7, color: "#0E9AA7", sub: "Activités sportives, clubs" },
  { key: "sante-bien-etre", label: "Santé & bien-être", top: 33.9, height: 10.7, color: "#7B5CC4", sub: "Soins, bien-être, détente" },
  { key: "acheter-equiper", label: "Acheter & s'équiper", top: 45.2, height: 10.7, color: "#1FA37A", sub: "Boutiques, créateurs, déco" },
  { key: "vie-pratique", label: "Vie pratique", top: 56.6, height: 10.4, color: "#8C7B45", sub: "Services, dépannage, transports" },
  { key: "famille-travail", label: "Famille & Travail", top: 67.8, height: 10.4, color: "#E5A020", sub: "Enfants, éducation, télétravail" },
  { key: "agenda", label: "Événements", top: 78.7, height: 10.4, color: "#C2456B", sub: "Sorties, ateliers, bons plans" },
  { key: "seconde-main", label: "Seconde main", top: 89.6, height: 10.4, color: "#2E9E8F", sub: "Acheter, vendre, donner" },
];

// Agenda : peu de fiches, donc pas de liste de rubriques comme les autres
// catégories — 3 grandes vignettes photo (style « Listes de Koté Moris »)
// qui mènent chacune vers le même sous-menu déroulant que sa rubrique
// d'origine (evenements-culturels/-associatifs/-sportifs).
const AGENDA_GROUPS: { key: string; label: string; photo: string }[] = [
  { key: "evenements-culturels", label: "Sorties et concerts", photo: "/photos/agenda-sorties-concerts.jpg" },
  { key: "evenements-sportifs", label: "Événements sportifs", photo: "/photos/agenda-evenements-sportifs.jpg" },
  { key: "evenements-associatifs", label: "Patrimoine et culture", photo: "/photos/agenda-patrimoine-culture.jpg" },
];

// Métadonnées de rubrique (emoji/libellé) par clé, tous univers confondus.
const RUBRIQUE_MAP: Record<string, { key: string; label: string; emoji: string }> = Object.fromEntries(
  Object.values(SUBCATEGORIES)
    .flat()
    .map((s) => [s.key, s])
);

// Catégorie parente d'une rubrique (ex. "evenements-culturels" → "agenda") —
// utilisé pour adapter le libellé du compteur ("événements" vs "adresses").
const RUBRIQUE_CATEGORY_MAP: Record<string, CategoryKey> = Object.fromEntries(
  Object.entries(SUBCATEGORIES).flatMap(([cat, subs]) =>
    (subs ?? []).map((s) => [s.key, cat as CategoryKey])
  )
);

// Libellé par option de sous-filtre (ex. "opticiens" → "Opticiens", "pressing-blanchisserie" →
// "Pressing & blanchisserie") : ces sous-filtres (spécialité, type de service…) ne sont pas des
// rubriques, donc absents de RUBRIQUE_MAP — on les indexe quand même dans la recherche libre
// (searchTokensById) pour que taper "opticien" ou "pressing" trouve les bonnes fiches.
const FILTER_OPTION_LABEL: Record<string, string> = Object.fromEntries(
  FILTER_GROUPS.flatMap((g) => g.options.map((o) => [o.key, o.label]))
);


const ZONES: { key: string; label: string; emoji: string }[] = [
  { key: "nord", label: "Nord", emoji: "⬆️" },
  { key: "est", label: "Est", emoji: "➡️" },
  { key: "sud", label: "Sud", emoji: "⬇️" },
  { key: "ouest", label: "Ouest", emoji: "⬅️" },
  { key: "centre", label: "Centre", emoji: "🎯" },
];

// Mélange (Fisher-Yates) une copie du tableau — pour varier « Coups de cœur »
// et « Listes de Koté Moris » à chaque connexion plutôt que toujours les mêmes
// premiers éléments du tableau source.
// Correspondance approximative entre les 8 rubriques (CategoryKey, cochées dans
// Mes préférences) et les groupes de sélections éditoriales KM (taxonomie
// différente, cf. data/selections.ts) — sert à faire remonter les listes
// pertinentes en tête de « Les listes de Koté Moris » sur l'accueil.
const CATEGORY_TO_SELECTION_GROUPS: Partial<Record<CategoryKey, SelectionGroup[]>> = {
  "manger-boire": ["manze"],
  "sortir-decouvrir": ["sorti", "nature"],
  "faire-du-sport": ["sport"],
  "acheter-equiper": ["shopping"],
  "famille-travail": ["famille"],
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-muted">
      Chargement de la carte…
    </div>
  ),
});

// Carte d'une sélection « vedette » (coups de cœur, kids friendly) au format
// des cartes de sélections (photo 4:5 + titre), avec le badge rond Koté Moris
// en coin pour la distinguer. Accueil (carrousel) + écran Sélections (grille).
function FeaturedSelectionCard({
  title,
  photoUrl,
  badge,
  onClick,
  className = "",
}: {
  title: string;
  photoUrl?: string;
  badge: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left aspect-[4/5] rounded-2xl overflow-hidden shadow-card bg-primary-tint active:scale-[.98] transition-transform ${className}`}
    >
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={badge} alt="" aria-hidden className="absolute top-1.5 left-1.5 w-11 h-11 object-contain drop-shadow" />
      <span className="absolute inset-x-0 bottom-0 p-2.5">
        <span className="block font-serif text-[12px] font-semibold leading-tight text-white line-clamp-2">{title}</span>
      </span>
    </button>
  );
}

// Compte → raccourci vers les listes personnalisées (/mon-compte/listes).
// Composant à part pour n'appeler useFavoriteLists (requête /api/favorite-lists)
// que lorsque l'écran Compte est affiché à un utilisateur connecté.
function MyListsLink() {
  const { status, lists } = useFavoriteLists();
  return (
    <Link
      href="/mon-compte/listes"
      className="bg-surface border border-border rounded-2xl shadow-sm p-4 flex items-center gap-3 no-underline text-ink active:scale-[.99] transition-transform"
    >
      <ListBullets size={20} weight="bold" className="text-primary-deep" aria-hidden />
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-bold text-ink">Mes listes</span>
        <span className="block text-[12px] text-muted">
          {status === "ready" && lists.length > 0
            ? `${lists.length} liste${lists.length > 1 ? "s" : ""}`
            : "Crée tes listes d'adresses"}
        </span>
      </span>
      <span className="text-[18px] font-bold text-primary-deep" aria-hidden>›</span>
    </Link>
  );
}

export default function DirectoryClient({
  businesses,
  previewListings = [],
}: {
  businesses: Business[];
  previewListings?: Listing[];
}) {
  // Ordre mélangé côté client uniquement (après hydratation) pour que « Coups de
  // cœur » et « Listes de Koté Moris » varient à chaque connexion sans provoquer
  // de désaccord d'hydratation SSR (le 1er rendu client doit matcher le serveur).
  const [shuffleReady, setShuffleReady] = useState(false);
  useEffect(() => setShuffleReady(true), []);
  const { statuses: favoriteStatuses, getStatus, mergeStatuses } = useFavorites();
  const { favoriteSelectionIds, isFavoriteSelection, toggleFavoriteSelection, mergeFavoriteSelections } =
    useFavoriteSelections();
  const { preferences, toggleInterest, setHasKids, mergePreferences } = usePreferences();
  const account = useAccount();
  const [loggingOut, setLoggingOut] = useState(false);
  async function handleLogout() {
    setLoggingOut(true);
    await createSupabaseBrowserClient().auth.signOut();
    window.location.reload();
  }
  // Avatar par défaut (tant que l'utilisateur n'a pas uploadé sa propre photo),
  // différent selon son statut : admin > contributeur KM > découverte.
  const defaultAvatar =
    account.role === "admin"
      ? "/avatar-admin.png"
      : account.role === "community"
      ? "/avatar-contributeur.png"
      : "/avatar-decouverte.png";
  useFavoritesSync(account.loggedIn, mergeStatuses, mergeFavoriteSelections);
  usePreferencesSync(account.loggedIn, mergePreferences);
  const favoriteBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "favori"),
    [businesses, favoriteStatuses]
  );
  const aTesterBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "a-tester"),
    [businesses, favoriteStatuses]
  );
  const testeBusinesses = useMemo(
    () => businesses.filter((b) => favoriteStatuses.get(b.id) === "teste"),
    [businesses, favoriteStatuses]
  );
  // Favoris → carte : coups de cœur + à tester + testé réunis (fiches sans GPS ignorées par <Map>).
  const favorisMapBusinesses = useMemo(
    () => [...favoriteBusinesses, ...aTesterBusinesses, ...testeBusinesses],
    [favoriteBusinesses, aTesterBusinesses, testeBusinesses]
  );
  // Profil : catégories les plus représentées parmi coups de cœur/à tester/testé, pour un mini aperçu de « ses goûts ».
  const profilTopCategories = useMemo(() => {
    const counts = new globalThis.Map<CategoryKey, number>();
    for (const b of favorisMapBusinesses) {
      counts.set(b.category, (counts.get(b.category) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key, count]: [CategoryKey, number]) => ({ category: CATEGORY_MAP[key], count }));
  }, [favorisMapBusinesses]);
  const profilFavoriteSelections = useMemo(
    () => SELECTIONS.filter((s) => favoriteSelectionIds.has(s.id)),
    [favoriteSelectionIds]
  );
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  // Partage : panneau de choix des statuts à inclure (favoris / à tester / testé),
  // ouvert au clic sur "Partager mes adresses" plutôt qu'un partage immédiat de tout.
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [shareStatuses, setShareStatuses] = useState<Set<FavoriteStatus>>(
    () => new Set(["favori", "a-tester", "teste"])
  );
  const toggleShareStatus = useCallback((status: FavoriteStatus) => {
    setShareStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);
  const shareSelectionBusinesses = useMemo(
    () => favorisMapBusinesses.filter((b) => shareStatuses.has(getStatus(b.id) as FavoriteStatus)),
    [favorisMapBusinesses, shareStatuses, getStatus]
  );
  const shareFavoris = useCallback(async () => {
    const lines = shareSelectionBusinesses.map((b) => `• ${b.name}`).join("\n");
    const text = shareSelectionBusinesses.length > 0
      ? `${shareTagline()}\n\nMes adresses :\n${lines}`
      : `${shareTagline()}\n\nJe n'ai pas encore d'adresses enregistrées sur Koté Moris.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mes adresses Koté Moris", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareFeedback("Copié dans le presse-papiers !");
    } catch {
      setShareFeedback(null);
      return;
    }
    setTimeout(() => setShareFeedback(null), 2500);
  }, [shareSelectionBusinesses]);

  // Profil → photo de profil : aperçu local mis à jour dès l'upload réussi,
  // sans attendre le refetch async de useAccount().
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useCallback(async (file: File) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
    if (res.ok) {
      const { avatarUrl } = (await res.json()) as { avatarUrl: string };
      setAvatarPreview(avatarUrl);
    }
    setAvatarUploading(false);
  }, []);

  // Profil → sauvegarde des favoris : export/import d'un fichier JSON, seul
  // moyen de ne pas perdre ses favoris (localStorage uniquement, pas de compte).
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const exportFavoris = useCallback(async () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favorites: favorisMapBusinesses.map((b) => ({
        id: b.id,
        name: b.name,
        status: getStatus(b.id) ?? "favori",
      })),
    };
    const json = JSON.stringify(payload, null, 2);
    const filename = `kote-moris-favoris-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([json], filename, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Mes favoris Koté Moris" });
        return;
      }
    } catch {
      // L'utilisateur a annulé le partage, ou l'API a échoué : on retombe sur le téléchargement.
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setBackupFeedback("Fichier téléchargé !");
    setTimeout(() => setBackupFeedback(null), 2500);
  }, [favorisMapBusinesses, getStatus]);

  const importFavoris = useCallback(async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const entries: Record<string, FavoriteStatus> = {};
      for (const item of parsed?.favorites ?? []) {
        if (item?.id && item?.status) entries[item.id] = item.status;
      }
      const count = mergeStatuses(entries);
      setBackupFeedback(count > 0 ? `${count} favori${count > 1 ? "s" : ""} restauré${count > 1 ? "s" : ""} !` : "Fichier vide ou invalide.");
    } catch {
      setBackupFeedback("Fichier illisible : ce n'est pas une sauvegarde Koté Moris valide.");
    }
    setTimeout(() => setBackupFeedback(null), 3500);
  }, [mergeStatuses]);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");
  const [activeThemes, setActiveThemes] = useState<Set<string>>(new Set());
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);
  const [zonePickerPos, setZonePickerPos] = useState<{ top: number; left: number } | null>(null);
  const zonePickerBtnRef = useRef<HTMLButtonElement>(null);
  const zonePickerPanelRef = useRef<HTMLDivElement>(null);
  // Facettes de rubrique — multi-sélection. Une entrée par groupe de filtre
  // transversal (cf. FILTER_GROUPS), plus prix et badges qui ne dépendent pas
  // de la taxonomie.
  const [facetGroups, setFacetGroups] = useState<Record<string, Set<string>>>({});
  const [facetPrices, setFacetPrices] = useState<Set<string>>(new Set());
  const [facetBadges, setFacetBadges] = useState<Set<string>>(new Set());
  const [expandedInSidebar, setExpandedInSidebar] = useState<Set<string>>(new Set());
  const [resultsView, setResultsView] = useState<"liste" | "carte">("liste");
  // Une fois affichée, la carte mobile reste montée (juste masquée en CSS,
  // comme sur desktop) : avant, elle était démontée à chaque retour en liste
  // et donc entièrement recréée (tuiles OSM, marqueurs…) au prochain aller,
  // ce qui causait un fort ralentissement à chaque bascule liste/carte.
  const [mapEverOpened, setMapEverOpened] = useState(false);
  // Favoris : bascule optionnelle liste ↔ carte (pas affichée par défaut).
  const [favorisMapOpen, setFavorisMapOpen] = useState(false);
  // « Autour de moi » : tri par distance depuis la position de l'utilisateur.
  const [nearMe, setNearMe] = useState(false);
  // Filtre transversal "ouvert maintenant" (cf. lib/openHours) : exclut les
  // fiches dont on est sûr qu'elles sont fermées à l'instant présent ; les
  // fiches sans horaires ou aux horaires illisibles restent affichées.
  const [openNow, setOpenNow] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "denied" | "unavailable" | "ok">("idle");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Ouvre directement une fiche si l'URL porte ?open=<id> — utilisé par les
  // liens de retour depuis une liste de favoris partagée (app/liste/[token]).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (id) setOpenId(id);
  }, []);
  // Accueil → Listes de Koté Moris : sélection éditoriale ouverte (null = grille des sélections).
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  // Filtre de la grille "Explorer toutes nos sélections" (Tous / grandes thématiques).
  const [selectionExploreFilter, setSelectionExploreFilter] = useState<SelectionGroup | "tous">("tous");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [filterByMap, setFilterByMap] = useState(false);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  // Mobile : forcer la liste à plat malgré l'écran d'accueil par catégories.
  const [browseAll, setBrowseAll] = useState(false);
  // Bandeau de recherche ouvert (tap sur le pseudo-champ d'accueil) —
  // indépendant de `browseAll` : affiche juste le champ, sans forcer tout de
  // suite le montage de la liste complète tant qu'aucun mot n'est tapé.
  const [searchOpen, setSearchOpen] = useState(false);
  // Focalise le champ de recherche du bandeau dès son montage, dans le même
  // geste que le clic qui le fait apparaître (évite le clavier qui met du
  // temps à s'ouvrir ou qui demande un second tap sur mobile).
  const [focusSearchOnMount, setFocusSearchOnMount] = useState(false);
  // Accueil « Option A » : menu d'entrée → puis mode choisi.
  const [homeMode, setHomeMode] = useState<
    "menu" | "recherche" | "categories" | "favoris" | "listes" | "ajouter" | "profil"
  >("menu");
  // Accueil « Par catégorie » : catégorie choisie, dont on affiche les rubriques
  // (un seul niveau de profondeur). null = grille des 8 catégories.
  const [homeCategory, setHomeCategory] = useState<CategoryKey | null>(null);
  // Accueil → carte « Par expérience » : déplie le choix entre les deux
  // usages de /mon-plan (Trouver un lieu / Plan complet).
  const [experienceOpen, setExperienceOpen] = useState(false);
  // Accueil « Par catégorie » → rubrique choisie qui a des sous-rubriques
  // (cf. FILTER_GROUPS[].browsable) : page intermédiaire avant les résultats.
  const [homeSubRubrique, setHomeSubRubrique] = useState<string | null>(null);
  // Écran des rubriques d'une catégorie : sélection multiple via cases à
  // cocher, en plus du tap direct (une seule rubrique → résultats immédiats).
  // Vidée à chaque changement de catégorie.
  const [selectedRubriques, setSelectedRubriques] = useState<Set<string>>(new Set());
  // Page de sous-rubriques (cuisine, discipline…) : même principe de
  // sélection multiple via cases à cocher, en plus du tap direct. Vidée à
  // chaque changement de rubrique ouverte (homeSubRubrique).
  const [selectedSubOptions, setSelectedSubOptions] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const favorisSectionRef = useRef<HTMLDivElement>(null);
  const aTesterSectionRef = useRef<HTMLDivElement>(null);
  const testeSectionRef = useRef<HTMLDivElement>(null);

  const onBoundsChange = useCallback((b: MapBounds) => setMapBounds(b), []);

  // Consomme le drapeau d'autofocus juste après le montage du champ : React
  // n'applique `autoFocus` qu'à l'insertion du nœud DOM, donc le repasser à
  // false ensuite n'enlève rien, mais évite qu'un futur setBrowseAll(true)
  // (chip catégorie, autour de moi…) ne réutilise ce drapeau par erreur.
  useEffect(() => {
    if (focusSearchOnMount) setFocusSearchOnMount(false);
  }, [focusSearchOnMount]);

  // Quitte l'écran d'accueil "Listes de Koté Moris" → referme la sélection ouverte.
  useEffect(() => {
    if (homeMode !== "listes") setSelectedListId(null);
  }, [homeMode]);

  // Change de catégorie (ou en sort) → vide les cases cochées de la liste
  // de rubriques précédente.
  useEffect(() => {
    setSelectedRubriques(new Set());
  }, [homeCategory]);

  // Change de rubrique ouverte (ou en sort) → vide les cases cochées de la
  // page de sous-rubriques précédente.
  useEffect(() => {
    setSelectedSubOptions(new Set());
  }, [homeSubRubrique]);

  // Précharge le chunk JS de la carte (Leaflet) pendant que l'utilisateur
  // est encore sur l'accueil, au lieu d'attendre le premier mot tapé : sans
  // ça, le tout premier caractère qui affiche les résultats paie d'un coup
  // le téléchargement + l'init de la carte, d'où le à-coup ressenti
  // seulement à la première lettre.
  useEffect(() => {
    import("./Map");
  }, []);

  // Sur desktop, liste et carte s'affichent côte à côte (toujours besoin de
  // la carte) ; sur mobile, seule la liste est visible par défaut. On évite
  // d'initialiser Leaflet (coûteux : tuiles, marqueurs...) tant que la carte
  // n'est pas vraiment affichée sur mobile — avant, elle restait montée
  // (juste masquée en CSS), payée en plus du reste au premier caractère tapé.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const businessById = useMemo(() => {
    const record: Record<string, Business> = {};
    businesses.forEach((b) => { record[b.id] = b; });
    return record;
  }, [businesses]);

  const selectedList = selectedListId ? SELECTIONS.find((s) => s.id === selectedListId) ?? null : null;
  const selectedListBusinesses = useMemo(
    () => (selectedList ? selectedList.businessIds.map((id) => businessById[id]).filter((b): b is Business => !!b) : []),
    [selectedList, businessById]
  );
  // « Autour de moi » au sein d'une sélection Koté Moris : distance par fiche + tri du plus proche au plus loin.
  const selectedListDistanceById = useMemo(() => {
    const m: Record<string, number> = {};
    if (!nearMe || !userPos) return m;
    selectedListBusinesses.forEach((b) => {
      if (Number.isFinite(b.lat) && Number.isFinite(b.lng)) {
        m[b.id] = haversineKm(userPos.lat, userPos.lng, b.lat as number, b.lng as number);
      }
    });
    return m;
  }, [selectedListBusinesses, nearMe, userPos]);
  const selectedListBusinessesSorted = useMemo(() => {
    if (!nearMe || !userPos) return selectedListBusinesses;
    return [...selectedListBusinesses].sort((a, b) => {
      const da = selectedListDistanceById[a.id] ?? Infinity;
      const db = selectedListDistanceById[b.id] ?? Infinity;
      return da - db;
    });
  }, [selectedListBusinesses, nearMe, userPos, selectedListDistanceById]);
  // Au sein d'une sélection, sépare les plateformes/applis de livraison (grubmates, delivoo…) des adresses.
  const selectedListPlatformBusinesses = useMemo(
    () =>
      selectedList?.platformIds
        ? selectedListBusinessesSorted.filter((b) => selectedList.platformIds!.includes(b.id))
        : [],
    [selectedList, selectedListBusinessesSorted]
  );
  const selectedListRestBusinesses = useMemo(
    () =>
      selectedList?.platformIds
        ? selectedListBusinessesSorted.filter((b) => !selectedList.platformIds!.includes(b.id))
        : selectedListBusinessesSorted,
    [selectedList, selectedListBusinessesSorted]
  );
  // Mises en avant : les sélections "featured" + les weekends régionaux et la découverte de l'île, en grandes cartes photo.
  const highlightSelections = useMemo(
    () => SELECTIONS.filter((s) => s.featured || s.id.startsWith("weekend-") || s.id === "inviter-decouverte"),
    []
  );
  // Accueil → « Les listes de Koté Moris » : les groupes correspondant aux
  // préférences explicites (Mes préférences, Profil) passent devant, chaque
  // paquet restant mélangé après hydratation pour varier d'une session à l'autre.
  const homeSelections = useMemo(() => {
    const pool = shuffleReady ? shuffled(SELECTIONS) : SELECTIONS;
    const preferredGroups = new Set<SelectionGroup>(
      preferences.interests.flatMap((key) => CATEGORY_TO_SELECTION_GROUPS[key] ?? [])
    );
    if (preferences.hasKids) preferredGroups.add("famille");
    if (preferredGroups.size === 0) return pool;
    const matched = pool.filter((s) => preferredGroups.has(s.group));
    const rest = pool.filter((s) => !preferredGroups.has(s.group));
    return [...matched, ...rest];
  }, [shuffleReady, preferences]);
  const exploreSelections = useMemo(
    () => (selectionExploreFilter === "tous" ? SELECTIONS : SELECTIONS.filter((s) => s.group === selectionExploreFilter)),
    [selectionExploreFilter]
  );

  const subcategories = SUBCATEGORIES[active as keyof typeof SUBCATEGORIES];

  function resetFacets() {
    setFacetGroups({});
    setFacetPrices(new Set());
    setFacetBadges(new Set());
  }

  // Bascule une valeur dans le Set d'un groupe de filtre donné.
  function toggleFacetGroup(groupKey: string, key: string) {
    setFacetGroups((prev) => {
      const cur = new Set(prev[groupKey] ?? []);
      if (cur.has(key)) cur.delete(key);
      else cur.add(key);
      return { ...prev, [groupKey]: cur };
    });
  }

  function clearFacetGroup(groupKey: string) {
    setFacetGroups((prev) => ({ ...prev, [groupKey]: new Set() }));
  }

  // Bascule une valeur dans un Set d'état (multi-sélection).
  function toggleInSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Quitte la vue résultats (recherche, filtre par rubrique, « Autour de
  // moi »…) pour rejoindre un écran d'accueil (menu, Listes, Mon compte…).
  // Sans ce reset complet, `showHome` reste faux tant qu'un filtre est actif
  // (active/activeThemes/query/searchOpen) : la barre d'onglets change bien
  // d'état mais l'écran de destination ne s'affiche jamais — la liste
  // filtrée (jusqu'à ~2000 fiches, tri « Autour de moi » compris) reste
  // montée en dessous, d'où le ralenti ressenti au tap sur un onglet.
  function leaveResults(nextMode: typeof homeMode) {
    setActive("all");
    setActiveThemes(new Set());
    setActiveZone(null);
    setQuery("");
    setBrowseAll(false);
    setSearchOpen(false);
    setFocusSearchOnMount(false);
    setHomeCategory(null);
    setHomeMode(nextMode);
    resetFacets();
    setNearMe(false);
    setOpenNow(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Retour à l'écran d'accueil : réinitialise tous les filtres.
  function goHome() {
    leaveResults("menu");
  }

  // Entrée « Recherche » du menu d'accueil : ouvre le bandeau de recherche et
  // le focalise dès son montage (autoFocus, pas de setTimeout qui casserait
  // le geste utilisateur et retarderait le clavier mobile). N'active PAS
  // `browseAll` : tant qu'aucun mot n'est tapé, la liste complète (~2000
  // fiches) n'est pas montée — seule la recherche déclenche son affichage.

  // Onglet « Recherche » (bandeau du bas), pastille du bandeau d'accueil et
  // sidebar desktop : ouvrent directement le champ de recherche (plus
  // l'ancien écran intermédiaire « Comment veux-tu chercher ? », qui ajoutait
  // un tap avant de pouvoir taper — la recherche par catégorie reste
  // accessible via les tuiles Explorer de l'accueil).
  function focusSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSearchOpen(true);
    setFocusSearchOnMount(true);
  }

  // Arrivée en « mode ajout » depuis la page d'une liste perso (?addTo=<id>) :
  // on ouvre directement la recherche (le bandeau est géré par AddToListBanner).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("addTo")) {
      setSearchOpen(true);
      setFocusSearchOnMount(true);
    }
  }, []);

  // Onglet « Carte » : toutes les adresses en vue carte (même bascule que le
  // bouton liste/carte des résultats), filtres remis à zéro, centrée sur
  // l'utilisateur si la géolocalisation est déjà autorisée. « Autour de moi »
  // reste disponible dans la barre des résultats.
  function openMap() {
    leaveResults("menu");
    setBrowseAll(true);
    setResultsView("carte");
    setMapEverOpened(true);
    requestUserPosSilently();
    window.scrollTo({ top: 0 });
  }

  function selectCategory(key: string) {
    setActive(key);
    setActiveThemes(new Set());
    setBrowseAll(false);
    setHomeCategory(null);
  }

  // Chip de catégorie mobile dans les résultats/carte (cf. sidebar desktop,
  // masquée sur mobile) : filtre sans quitter la vue courante (liste/carte).
  function selectCategoryChip(key: string) {
    setActive((prev) => (prev === key ? "all" : key));
    setActiveThemes(new Set());
  }

  function toggleZone(key: string) {
    setActiveZone((prev) => (prev === key ? null : key));
  }

  // Positionne le panneau du picker de zone (rendu dans un portail, cf. plus
  // bas) : la rangée qui contient le bouton défile horizontalement
  // (overflow-x-auto, ce qui clippe aussi overflow-y), donc un panneau en
  // `absolute` s'y retrouvait tronqué / invisible — même bug déjà corrigé sur
  // FilterDropdown, avec la même solution (portail + position fixed calculée).
  useLayoutEffect(() => {
    if (!zonePickerOpen) return;
    const place = () => {
      const r = zonePickerBtnRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = 220;
      const left = Math.min(r.left, window.innerWidth - width - 8);
      setZonePickerPos({ top: r.bottom + 6, left: Math.max(8, left) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [zonePickerOpen]);

  // Ferme le picker de zone (bandeau du bas) au clic extérieur / Échap.
  useEffect(() => {
    if (!zonePickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (zonePickerBtnRef.current?.contains(t) || zonePickerPanelRef.current?.contains(t)) return;
      setZonePickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZonePickerOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [zonePickerOpen]);

  // Groupe de filtre « browsable » (page de sous-rubriques) applicable à une
  // rubrique donnée, s'il existe.
  function browsableGroupFor(rubriqueKey: string): FilterGroup | undefined {
    return FILTER_GROUPS.find((g) => g.browsable && g.appliesTo.includes(rubriqueKey));
  }

  // Depuis la liste de rubriques : ouvre la page de sous-rubriques si la
  // rubrique en a, sinon va directement aux résultats (comportement d'avant).
  function openRubrique(key: string) {
    if (PREMIUM_RUBRIQUE_KEYS.has(key) && !canSeeEventDetail) {
      window.location.href = "/mon-compte/upgrade";
      return;
    }
    if (browsableGroupFor(key)) {
      setHomeSubRubrique(key);
    } else {
      toggleTheme(key);
    }
  }

  // Depuis la page de sous-rubriques : sélectionne la rubrique + la facette
  // choisie, puis va aux résultats déjà filtrés.
  function selectSubRubrique(rubriqueKey: string, group: FilterGroup, optionKey: string) {
    toggleTheme(rubriqueKey);
    toggleFacetGroup(group.key, optionKey);
    setHomeSubRubrique(null);
  }

  // Case à cocher d'une sous-rubrique (cuisine, discipline…) dans la page de
  // sous-rubriques : indépendant du tap direct sur la ligne (qui va toujours
  // directement aux résultats pour 1 seule option).
  function toggleSubOptionSelection(key: string) {
    setSelectedSubOptions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Bouton « Voir les résultats » de la sélection multiple de sous-rubriques :
  // combine les options cochées (OU entre elles) au lieu de n'en garder qu'une.
  function viewSelectedSubOptions(rubriqueKey: string, group: FilterGroup) {
    if (selectedSubOptions.size === 0) return;
    toggleTheme(rubriqueKey);
    // Fusionne (et non remplace) : les autres groupes de filtre encore
    // applicables à `rubriqueKey` (ex. Ambiance pour Restaurants), conservés
    // par toggleTheme ci-dessus, ne doivent pas être écrasés par ce seul groupe.
    setFacetGroups((prev) => ({ ...prev, [group.key]: new Set(selectedSubOptions) }));
    setHomeSubRubrique(null);
    setSelectedSubOptions(new Set());
  }

  function toggleTheme(key: string) {
    setActiveThemes((prev) => (prev.has(key) ? new Set() : new Set([key])));
    // Les facettes ne valent que pour la rubrique courante : on retire celles
    // d'une rubrique précédente, mais on garde celles encore pertinentes pour
    // `key` (ex. l'Ambiance déjà cochée pour Restaurants reste active si on
    // revient sur Restaurants, y compris via la page de spécialités/cuisine).
    setFacetGroups((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const g of FILTER_GROUPS) {
        if (g.appliesTo.includes(key) && prev[g.key]) next[g.key] = prev[g.key];
      }
      return next;
    });
    setFacetPrices(new Set());
    setFacetBadges(new Set());
    // On conserve homeCategory : le bouton « Retour » de la page de résultats
    // ramène ainsi à la liste de rubriques de la bonne catégorie.
  }

  // Chip de catégorie mobile (« Autour de moi »/« Voir tout ») : dropdown de
  // sous-rubriques (ex. Restaurants, Cafés & bars… dans « Manger & boire »)
  // pour affiner sans quitter la liste, en multi-sélection (OU entre elles).
  function toggleActiveTheme(key: string) {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Case à cocher d'une rubrique dans la liste (indépendant du tap direct
  // sur la ligne, qui va toujours directement aux résultats pour 1 rubrique).
  function toggleRubriqueSelection(key: string) {
    setSelectedRubriques((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Bouton « Voir les résultats » de la sélection multiple : envoie
  // directement aux résultats filtrés sur les rubriques cochées, sans passer
  // par la page de sous-rubriques (cuisine, discipline…) même pour les
  // rubriques qui en ont une.
  function viewSelectedRubriques() {
    if (selectedRubriques.size === 0) return;
    setActiveThemes(new Set(selectedRubriques));
    // Comme pour toggleTheme : on ne garde que les facettes encore
    // pertinentes pour au moins une des rubriques cochées (ex. l'Ambiance de
    // Restaurants reste active si Restaurants fait partie de la sélection
    // combinée), au lieu de tout effacer.
    setFacetGroups((prev) => {
      const next: Record<string, Set<string>> = {};
      for (const g of FILTER_GROUPS) {
        if (g.appliesTo.some((k) => selectedRubriques.has(k)) && prev[g.key]) next[g.key] = prev[g.key];
      }
      return next;
    });
    setFacetPrices(new Set());
    setFacetBadges(new Set());
    setSelectedRubriques(new Set());
  }

  // Bouton « Retour » unifié : revient d'un cran (résultats → liste de
  // rubriques → sous-menu d'accueil → menu) au lieu de tout réinitialiser.
  // Utilisé par les bandeaux sticky de l'accueil et de la liste de résultats.
  const canGoBack =
    (resultsView === "carte" && !isDesktop) ||
    homeSubRubrique !== null ||
    homeCategory !== null ||
    activeThemes.size > 0 ||
    browseAll ||
    searchOpen ||
    query.trim() !== "" ||
    active !== "all" ||
    homeMode !== "menu";
  function goBackFromResults() {
    // Mobile, vue carte : le retour ramène d'abord à la liste.
    if (resultsView === "carte" && !isDesktop) {
      setResultsView("liste");
      return;
    }
    if (agendaBrowseAll) {
      setActive("all"); // retour aux 3 grandes vignettes Agenda (pas à la grille de catégories)
      return;
    }
    if (homeSubRubrique !== null) {
      setHomeSubRubrique(null); // retour à la liste de rubriques
      return;
    }
    if (activeThemes.size > 0) {
      setActiveThemes(new Set()); // retour à la liste de rubriques (ou à la grille catégories)
      return;
    }
    if (homeCategory !== null) {
      setHomeCategory(null); // remonte à la grille des catégories
      return;
    }
    if (browseAll) {
      setBrowseAll(false);
      return;
    }
    if (searchOpen || query.trim() !== "") {
      setQuery("");
      setSearchOpen(false);
      return;
    }
    if (active !== "all") {
      setActive("all");
      return;
    }
    if (homeMode !== "menu") {
      setHomeMode("menu");
      return;
    }
    goHome();
  }

  function toggleSidebarExpand(catKey: string) {
    setExpandedInSidebar((prev) => {
      const next = new Set(prev);
      if (next.has(catKey)) next.delete(catKey);
      else next.add(catKey);
      return next;
    });
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      c[b.category] = (c[b.category] || 0) + 1;
    });
    return c;
  }, [businesses]);

  // Accueil : catégories mises en avant en grand. Priorité aux préférences
  // explicites (cochées dans Profil, "j'ai des enfants" boostant "famille-travail"),
  // puis repli sur l'usage réel (coups de cœur/à tester/testé, cf.
  // profilTopCategories), puis sur les catégories les mieux fournies pour un
  // nouvel utilisateur sans préférences ni favoris.
  const preferredTopCategories = useMemo(() => {
    const keys = preferences.hasKids
      ? [...new Set([...preferences.interests, "famille-travail" as CategoryKey])]
      : preferences.interests;
    return keys
      .map((key) => CATEGORY_MAP[key])
      .filter((c): c is (typeof CATEGORIES)[number] => !!c && (counts[c.key] || 0) > 0)
      .map((category) => ({ category, count: counts[category.key] || 0 }));
  }, [preferences, counts]);

  const homeTopCategories = useMemo(() => {
    if (preferredTopCategories.length > 0) return preferredTopCategories;
    if (profilTopCategories.length > 0) return profilTopCategories;
    return [...CATEGORIES]
      .filter((c) => (counts[c.key] || 0) > 0)
      .sort((a, b) => (counts[b.key] || 0) - (counts[a.key] || 0))
      .slice(0, 3)
      .map((c) => ({ category: c, count: counts[c.key] || 0 }));
  }, [preferredTopCategories, profilTopCategories, counts]);

  // Accueil → « Nos coups de cœur » : fiches mises en avant par la rédaction,
  // limitées à celles qui ont une photo (essentiel pour ce format en carte photo).
  // Mélangées après hydratation pour ne pas montrer toujours les 12 mêmes ; les
  // fiches des rubriques préférées (Mes préférences, Profil) remontent devant,
  // chaque paquet restant mélangé — pas de tri figé à l'intérieur d'une rubrique.
  const coupsDeCoeur = useMemo(() => {
    const all = businesses.filter((b) => isEditorialPick(b) && b.photoUrl);
    const shuffledAll = shuffleReady ? shuffled(all) : all;
    // Les fiches avec fleurs en tête (elles illustrent l'encadré « Comment lire nos notes »).
    const pool = [
      ...shuffledAll.filter((b) => highlightedCriteria(b).length > 0),
      ...shuffledAll.filter((b) => highlightedCriteria(b).length === 0),
    ];
    const preferredKeys = new Set<CategoryKey>(preferences.interests);
    if (preferences.hasKids) preferredKeys.add("famille-travail");
    if (preferredKeys.size === 0) return pool;
    const matched = pool.filter((b) => preferredKeys.has(b.category));
    const rest = pool.filter((b) => !preferredKeys.has(b.category));
    return [...matched, ...rest];
  }, [businesses, shuffleReady, preferences]);

  // Accueil → « À la une » : trois sélections de fiches distinctes, choisies par
  // pastilles (recommandées / tables fleuries / kids friendly).
  const tablesFleuries = useMemo(() => {
    const all = businesses.filter((b) => b.photoUrl && highlightedCriteria(b).length > 0);
    return shuffleReady ? shuffled(all) : all;
  }, [businesses, shuffleReady]);
  const kidsAdresses = useMemo(() => {
    const all = businesses.filter((b) => (b.themes || []).includes("kids-friendly") && b.photoUrl);
    return shuffleReady ? shuffled(all) : all;
  }, [businesses, shuffleReady]);
  // Mixte : on alterne recommandées / tables fleuries / kids friendly (sans doublon),
  // pour que chaque type reste visible dans les 12 cartes.
  const uneList = useMemo(() => {
    const seen = new Set<string>();
    const out: Business[] = [];
    const sources = [coupsDeCoeur, tablesFleuries, kidsAdresses];
    for (let i = 0; out.length < 12 && i < 12; i++) {
      for (const src of sources) {
        const b = src[i];
        if (b && !seen.has(b.id) && out.length < 12) { seen.add(b.id); out.push(b); }
      }
    }
    return out;
  }, [coupsDeCoeur, tablesFleuries, kidsAdresses]);

  // Accueil → « Nouveautés » : fiches ajoutées à l'annuaire dans les 30 derniers
  // jours (createdAt), en avant-première pour les comptes premium uniquement —
  // c'est le perk "diffusion prioritaire", pas une section visible de tous.
  const newBusinesses = useMemo(() => {
    if (!account.isPremium) return [];
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return businesses
      .filter((b) => b.category !== "agenda" && b.createdAt && new Date(b.createdAt).getTime() >= cutoff)
      .sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string));
  }, [businesses, account.isPremium]);

  // Accueil → « Adresses kids friendly » : même logique que les coups de cœur,
  // filtrée sur le thème kids-friendly. Affichée uniquement si l'utilisateur a
  // coché « J'ai des enfants » dans ses préférences.
  const kidsFriendly = useMemo(() => {
    if (!preferences.hasKids) return [];
    const all = businesses.filter((b) => (b.themes || []).includes("kids-friendly") && b.photoUrl);
    return shuffleReady ? shuffled(all) : all;
  }, [businesses, shuffleReady, preferences.hasKids]);

  // Sélections « vedettes » (coups de cœur, kids friendly) : ce sont des filtres
  // sur les badges/thèmes des fiches, pas des listes de data/selections.ts,
  // mais présentées comme les autres sélections, en tête du carrousel de
  // l'accueil et de l'écran Sélections (réorganisation du 2026-09-25 : elles
  // avaient chacune leur bloc sur l'accueil, en doublon).
  const featuredSelections: { key: string; title: string; photoUrl?: string; badge: string; onClick: () => void }[] = [];
  if (coupsDeCoeur.length > 0) {
    featuredSelections.push({
      key: "coups-de-coeur",
      title: "Les coups de cœur de Koté Moris",
      photoUrl: coupsDeCoeur[0].photoUrl,
      badge: "/badge-selection.png",
      onClick: () => {
        setBrowseAll(true);
        setFacetBadges(new Set(["selection"]));
        setResultsView("liste");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  }
  if (kidsFriendly.length > 0) {
    featuredSelections.push({
      key: "kids-friendly",
      title: "Adresses kids friendly",
      photoUrl: kidsFriendly[0].photoUrl,
      badge: "/badge-kids.png",
      onClick: () => {
        setNearMe(false);
        setBrowseAll(true);
        setHomeCategory(null);
        setActiveThemes(new Set(["kids-friendly"]));
        setResultsView("liste");
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  }

  // Accueil → bandeau « Seconde main » : annonces réelles avec au moins une photo.
  const previewListingPhotos = useMemo(
    () => previewListings.filter((l) => l.photos && l.photos.length > 0),
    [previewListings]
  );

  // Accueil → « Événements à venir » : uniquement les fiches agenda avec une
  // date de début confirmée et future (les événements récurrents sans date
  // exacte, ex. Divali, n'ont pas leur place dans un teaser chronologique).
  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return businesses
      .filter((b) => b.category === "agenda" && b.eventStartDate)
      .filter((b) => new Date(b.eventStartDate + "T23:59:59").getTime() >= now)
      .sort(compareByEventDate)
      .slice(0, 5);
  }, [businesses]);

  const themeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!subcategories) return c;
    businesses.forEach((b) => {
      if (active !== "all" && b.category !== active) return;
      if (!b.themes || b.themes.length === 0) {
        c[UNCLASSIFIED] = (c[UNCLASSIFIED] || 0) + 1;
        return;
      }
      b.themes.forEach((t) => {
        c[t] = (c[t] || 0) + 1;
      });
    });
    return c;
  }, [businesses, active, subcategories]);

  const zoneCounts = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (active !== "all" && b.category !== active) return;
      if (b.zone) c[b.zone] = (c[b.zone] || 0) + 1;
    });
    return c;
  }, [businesses, active]);

  // Rubriques actives (une ou plusieurs) → déterminent les groupes de filtre
  // applicables. Chaque rubrique cochée garde ses propres filtres : cocher
  // « Restaurants » + une autre rubrique ne doit pas faire disparaître les
  // filtres (cuisine, ambiance…) propres aux restaurants.
  const activeRubriques = useMemo(
    () => new Set([...activeThemes].filter((k) => k !== UNCLASSIFIED)),
    [activeThemes]
  );
  // Vue « Voir tout » de l'agenda (aucune rubrique unique choisie) : les 2
  // groupes de filtre de l'agenda (type d'événement + nature de l'événement
  // sportif) restent quand même proposés, pour filtrer par sous-catégorie
  // sans être passé par une des 3 grandes vignettes.
  const agendaBrowseAll = active === "agenda" && activeThemes.size === 0;
  // Groupes de filtre transversaux applicables à l'union des rubriques actives.
  const applicableFilterGroups: FilterGroup[] = agendaBrowseAll
    ? FILTER_GROUPS.filter((g) => g.appliesTo.some((k) => RUBRIQUE_CATEGORY_MAP[k] === "agenda"))
    : FILTER_GROUPS.filter((g) => g.appliesTo.some((k) => activeRubriques.has(k)));

  // « Ménage » des fiches : on masque les tags déjà impliqués par le contexte de
  // navigation/filtre actif (rubriques + facettes sélectionnées). Le badge de
  // catégorie a été retiré des fiches (redondant avec la navigation par univers).
  const ficheHiddenKeys = useMemo(() => {
    const s = new Set<string>();
    activeThemes.forEach((k) => { if (k !== UNCLASSIFIED) s.add(k); });
    Object.values(facetGroups).forEach((set) => set.forEach((k) => s.add(k)));
    facetPrices.forEach((k) => s.add(k));
    return s;
  }, [activeThemes, facetGroups, facetPrices]);

  // Le filtrage flou (Levenshtein) sur ~2000 fiches est coûteux : on le
  // déporte sur `deferredQuery` pour que la frappe reste fluide (React
  // priorise le rendu de l'input, puis recalcule la liste dès qu'il est
  // libre, sans bloquer chaque caractère tapé).
  const deferredQuery = useDeferredValue(query);

  // Tokens de recherche précalculés une fois par fiche (recalculés
  // seulement quand `businesses` change, pas à chaque frappe) : évite de
  // renormaliser/redécouper nom + adresse + catégorie + rubriques de
  // chaque fiche à chaque caractère tapé, qui était la vraie source de
  // lenteur pendant la saisie. Inclut aussi les libellés de sous-filtres
  // (FILTER_OPTION_LABEL — « Opticiens », « Pressing & blanchisserie »…) et
  // les synonymes métier sans équivalent dans la classification
  // (SEARCH_SYNONYMS — « quincaillerie », « plombier »…), pour que la
  // recherche libre les retrouve même sans naviguer par rubrique.
  const searchTokensById = useMemo(() => {
    const m: Record<string, string[]> = {};
    businesses.forEach((b) => {
      const themes = b.themes || [];
      const filters = b.filters || [];
      const rubriqueLabels = themes.map((t) => RUBRIQUE_MAP[t]?.label || "").join(" ");
      const filterLabels = filters.map((f) => FILTER_OPTION_LABEL[f] || "").join(" ");
      const synonymWords = SEARCH_SYNONYMS.filter(
        (s) =>
          s.rubriques?.some((r) => themes.includes(r)) ||
          s.filters?.some((f) => filters.includes(f)) ||
          s.businessIds?.includes(b.id)
      )
        .flatMap((s) => s.words)
        .join(" ");
      m[b.id] = tokenize(
        b.name + " " + b.address + " " + CATEGORY_MAP[b.category].label + " " + rubriqueLabels + " " + filterLabels + " " + synonymWords
      );
    });
    return m;
  }, [businesses]);

  // Score de pertinence d'une fiche pour une recherche donnée, basé
  // uniquement sur le nom : une correspondance de nom (même partielle) doit
  // toujours passer devant une fiche qui ne matche que par son adresse ou sa
  // rubrique — sinon un nom exact comme « La Plage » peut se retrouver noyé
  // derrière des « Plage de/publique de... » qui ne matchent que par hasard.
  function nameMatchScore(name: string, q: string): number {
    const n = normalizeText(name);
    const qn = normalizeText(q).trim();
    if (!qn) return 0;
    if (n === qn) return 4;
    if (n.startsWith(qn)) return 3;
    if (n.includes(qn)) return 2;
    const nameTokens = tokenize(name);
    const qTokens = qn.split(/\s+/).filter(Boolean);
    if (qTokens.every((qt) => nameTokens.some((nt) => nt.startsWith(qt)))) return 1;
    return 0;
  }

  const rows = useMemo(() => {
    const q = deferredQuery.trim();
    return businesses
      .filter((b) => {
        if (activeZone && b.zone !== activeZone) return false;
        if (active !== "all" && b.category !== active) return false;
        if (activeThemes.size > 0) {
          const themes = b.themes || [];
          const matches =
            (activeThemes.has(UNCLASSIFIED) && themes.length === 0) ||
            themes.some((t) => activeThemes.has(t));
          if (!matches) return false;
        }
        // Facettes de rubrique : chaque groupe de filtre applicable (OU en son
        // sein) — testé sur b.filters, quand une rubrique est active ou en
        // vue « Voir tout » de l'agenda (les 2 groupes agenda combinés). Un
        // groupe qui ne s'applique pas à la rubrique de cette fiche (cas de
        // plusieurs rubriques cochées à la fois, chacune avec ses propres
        // groupes) ne doit pas l'exclure : seules les fiches concernées par
        // ce groupe sont contraintes par la sélection.
        if (activeRubriques.size > 0 || agendaBrowseAll) {
          const filters = b.filters || [];
          const themes = b.themes || [];
          for (const g of applicableFilterGroups) {
            const sel = facetGroups[g.key];
            if (!sel || sel.size === 0) continue;
            const groupAppliesToFiche = g.appliesTo.some((k) => themes.includes(k));
            if (groupAppliesToFiche && !filters.some((f) => sel.has(f))) return false;
          }
        }
        // Prix et sélection/badge : facettes transversales, indépendantes de la rubrique.
        if (facetPrices.size > 0 && !(b.priceRange && facetPrices.has(b.priceRange))) return false;
        if (facetBadges.size > 0) {
          const matchesBadge = !!b.badge && facetBadges.has(b.badge);
          const matchesKids = facetBadges.has("kids-friendly") && (b.themes || []).includes("kids-friendly");
          const matchesFleurs = facetBadges.has("fleurs") && highlightedCriteria(b).length > 0;
          const matchesFleurs4 = facetBadges.has("fleurs4") && highlightedCriteria(b).length === 4;
          if (!matchesBadge && !matchesKids && !matchesFleurs && !matchesFleurs4) return false;
        }
        // Agenda : masque les événements dont la date exacte connue est passée (ponctuels ou récurrents).
        if (b.category === "agenda" && isPastEvent(b)) return false;
        if (openNow && !matchesOpenNow(b.hours)) return false;
        if (!q) return true;
        return fuzzyMatchTokens(searchTokensById[b.id] ?? [], q);
      })
      .sort((a, b) => {
        if (q) {
          const scoreDiff = nameMatchScore(b.name, q) - nameMatchScore(a.name, q);
          if (scoreDiff !== 0) return scoreDiff;
        }
        const tierDiff = (b.tier === "premium" ? 1 : 0) - (a.tier === "premium" ? 1 : 0);
        if (tierDiff !== 0) return tierDiff;
        if (a.category === "agenda" && b.category === "agenda") return compareByEventDate(a, b);
        // Classement Koté Moris (fleurs, puis niveau interne) : départage à statut premium égal.
        return koteMorisLevel(b) - koteMorisLevel(a);
      });
  }, [businesses, deferredQuery, searchTokensById, active, activeThemes, activeZone, activeRubriques, agendaBrowseAll, applicableFilterGroups, facetGroups, facetPrices, facetBadges, openNow]);

  // Base rubrique(s) (rubriques actives + zone + recherche, hors facettes) pour
  // les compteurs. Avec plusieurs rubriques cochées, chaque groupe de filtre
  // ne compte que sur les fiches des rubriques auxquelles il s'applique.
  const facetCounts = useMemo(() => {
    const perGroup: Record<string, Record<string, number>> = {};
    const price: Record<string, number> = {};
    const badge: Record<string, number> = {};
    if (activeRubriques.size === 0 && !agendaBrowseAll) return { perGroup, price, badge, total: 0 };
    const groups = agendaBrowseAll
      ? FILTER_GROUPS.filter((g) => g.appliesTo.some((k) => RUBRIQUE_CATEGORY_MAP[k] === "agenda"))
      : FILTER_GROUPS.filter((g) => g.appliesTo.some((k) => activeRubriques.has(k)));
    groups.forEach((g) => (perGroup[g.key] = {}));
    const q = deferredQuery.trim();
    let total = 0;
    businesses.forEach((b) => {
      const themes = b.themes || [];
      if (activeRubriques.size > 0) {
        if (!themes.some((t) => activeRubriques.has(t))) return;
      } else if (b.category !== "agenda") {
        return;
      }
      if (activeZone && b.zone !== activeZone) return;
      if (q && !fuzzyMatchTokens(tokenize(b.name + " " + b.address), q)) return;
      total++;
      const filters = b.filters || [];
      groups.forEach((g) => {
        if (!g.appliesTo.some((k) => themes.includes(k))) return;
        const optionKeys = new Set(g.options.map((o) => o.key));
        filters.forEach((f) => {
          if (optionKeys.has(f)) perGroup[g.key][f] = (perGroup[g.key][f] || 0) + 1;
        });
      });
      if (b.priceRange) price[b.priceRange] = (price[b.priceRange] || 0) + 1;
      if (b.badge) badge[b.badge] = (badge[b.badge] || 0) + 1;
      if (themes.includes("kids-friendly")) {
        badge["kids-friendly"] = (badge["kids-friendly"] || 0) + 1;
      }
      if (highlightedCriteria(b).length === 4) {
        badge["fleurs4"] = (badge["fleurs4"] || 0) + 1;
      }
    });
    return { perGroup, price, badge, total };
  }, [businesses, activeRubriques, agendaBrowseAll, activeZone, deferredQuery]);

  // Compteurs par option pour la page de sous-rubriques (avant sélection de
  // rubrique/facette — donc indépendant de activeRubrique/facetGroups).
  const subRubriqueCounts = useMemo(() => {
    const c: Record<string, number> = {};
    if (!homeSubRubrique) return c;
    businesses.forEach((b) => {
      if (!(b.themes || []).includes(homeSubRubrique)) return;
      (b.filters || []).forEach((f) => {
        c[f] = (c[f] || 0) + 1;
      });
    });
    return c;
  }, [businesses, homeSubRubrique]);

  const facetActive =
    Object.values(facetGroups).reduce((n, set) => n + set.size, 0) + facetPrices.size + facetBadges.size > 0;

  // Mobile, vue carte : la liste affichée sous la carte reprend automatiquement
  // les adresses de la zone visible (plus besoin de la case « Zone visible »).
  const mobileMapView = !isDesktop && resultsView === "carte";
  // Bornes différées : le recalcul de la liste après un déplacement de carte
  // passe en basse priorité, pour que le glisser/zoomer reste fluide.
  const deferredMapBounds = useDeferredValue(mapBounds);
  const boundsFilterOn = filterByMap || mobileMapView;

  // Cartes affichées : limitées à la zone visible de la carte si le filtre est actif.
  const boundedRows = useMemo(() => {
    if (!boundsFilterOn || !deferredMapBounds) return rows;
    const mb = deferredMapBounds;
    return rows.filter((b) =>
      b.lat === undefined || b.lng === undefined
        ? !mobileMapView // sans GPS : invisibles sur la carte, donc absentes de la liste sous la carte
        : b.lat <= mb.north && b.lat >= mb.south && b.lng <= mb.east && b.lng >= mb.west
    );
  }, [rows, boundsFilterOn, deferredMapBounds, mobileMapView]);

  // « Autour de moi » : distance par fiche + tri du plus proche au plus loin.
  const distanceById = useMemo(() => {
    const m: Record<string, number> = {};
    if (!nearMe || !userPos) return m;
    boundedRows.forEach((b) => {
      if (Number.isFinite(b.lat) && Number.isFinite(b.lng)) {
        m[b.id] = haversineKm(userPos.lat, userPos.lng, b.lat as number, b.lng as number);
      }
    });
    return m;
  }, [boundedRows, nearMe, userPos]);

  const visibleRows = useMemo(() => {
    if (!nearMe || !userPos) return boundedRows;
    return [...boundedRows].sort((a, b) => {
      const da = distanceById[a.id] ?? Infinity;
      const db = distanceById[b.id] ?? Infinity;
      return da - db;
    });
  }, [boundedRows, nearMe, userPos, distanceById]);

  // Marqueurs affichés sur la carte : plafonnés pour éviter les lags Leaflet
  // quand la liste n'est pas filtrée par rubrique (ex. « Autour de moi » qui
  // bascule sur « Explorer » ≈ 2000 fiches sans clustering). Priorité aux plus
  // proches si la position est connue, sinon on tronque simplement.
  const MAX_MAP_MARKERS = 400;
  const mapMarkerRows = useMemo(() => {
    if (rows.length <= MAX_MAP_MARKERS) return rows;
    if (userPos) {
      return [...rows]
        .filter((b) => Number.isFinite(b.lat) && Number.isFinite(b.lng))
        .sort(
          (a, b) =>
            haversineKm(userPos.lat, userPos.lng, a.lat as number, a.lng as number) -
            haversineKm(userPos.lat, userPos.lng, b.lat as number, b.lng as number)
        )
        .slice(0, MAX_MAP_MARKERS);
    }
    return rows.slice(0, MAX_MAP_MARKERS);
  }, [rows, userPos]);

  // Active « Autour de moi » : demande la position (une fois), puis trie par distance.
  // Ne bascule pas en "Explorer" (browseAll) quand on est déjà dans une sélection
  // Koté Moris ouverte : on veut trier ses adresses, pas quitter la liste.
  function toggleNearMe() {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    if (userPos) {
      setNearMe(true);
      if (showHome && !selectedListId) setBrowseAll(true);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
        setNearMe(true);
        if (showHome && !selectedListId) setBrowseAll(true);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  // Localise silencieusement (sans activer le tri « Autour de moi ») pour
  // afficher le point « vous êtes ici » dès l'ouverture de la carte.
  function requestUserPosSilently() {
    if (userPos || geoStatus !== "idle") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  function selectFromMap(id: string) {
    setSelectedId(id);
    // Mobile : la liste est sous la carte ; faire défiler la page ferait sortir
    // la carte (et le popup ouvert) de l'écran.
    if (isDesktop) cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function selectFromCard(id: string) {
    setOpenId(id); // ouvre la vue détail plein écran (sans déplacer la carte)
  }

  const canSeeEventDetail = account.isPremium || account.role === "community" || account.role === "admin";

  function openEvent(id: string) {
    if (canSeeEventDetail) {
      setOpenId(id);
    } else {
      window.location.href = "/mon-compte/upgrade";
    }
  }

  const openBusiness = openId ? businesses.find((b) => b.id === openId) ?? null : null;

  function clearThemeFilter(key: string) {
    setActiveThemes((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  const activeThemeLabel = useMemo(() => {
    if (activeThemes.size === 0) return null;
    if (activeThemes.size > 1) {
      // Sélection multiple de rubriques (ex. Restaurants + Cafés, bars & glaciers) :
      // pas de clé unique à effacer, donc pas de bouton « x » simple par rubrique.
      const labels = [...activeThemes]
        .map((k) => (k === UNCLASSIFIED ? "Non classé" : (subcategories?.find((s) => s.key === k) ?? RUBRIQUE_MAP[k])?.label))
        .filter((l): l is string => !!l);
      return { key: null, emoji: "🏷️", label: labels.length > 0 ? labels.join(" + ") : `${activeThemes.size} rubriques` };
    }
    const key = [...activeThemes][0];
    if (key === UNCLASSIFIED) return { key, emoji: "❔", label: "Non classé" };
    // Rubrique de la catégorie active, sinon repli global (filtres inter-catégories).
    const theme = subcategories?.find((s) => s.key === key) ?? RUBRIQUE_MAP[key];
    return theme ? { key: theme.key, emoji: theme.emoji, label: theme.label } : null;
  }, [activeThemes, subcategories]);

  // Comptes globaux par rubrique (toutes catégories, tenant compte de la zone).
  const themeCountsAll = useMemo(() => {
    const c: Record<string, number> = {};
    businesses.forEach((b) => {
      if (activeZone && b.zone !== activeZone) return;
      (b.themes ?? []).forEach((t) => {
        c[t] = (c[t] || 0) + 1;
      });
    });
    return c;
  }, [businesses, activeZone]);

  // Écran d'accueil : 8 catégories plutôt que 2574 résultats en vrac.
  // Masqué dès que la recherche est ouverte (même sans mot tapé) : le
  // bandeau de recherche prend alors le dessus dans l'en-tête.
  const showHome =
    active === "all" && activeThemes.size === 0 && query.trim() === "" && !browseAll && !searchOpen;

  // 1 seule lettre tapée matche quasi tout (n'importe quel mot commençant
  // par cette lettre, sur ~2000 fiches) : monter la liste dès la 1ère lettre
  // revenait à remonter un gros paquet de cartes d'un coup, exactly le
  // ralenti observé. On attend 2 caractères avant de considérer qu'il y a
  // une vraie recherche — sur `deferredQuery` pour ne pas bloquer la frappe
  // le temps que React tranche.
  const hasQuery = deferredQuery.trim().length >= 2;

  // Liste/carte des résultats (jusqu'à ~2000 fiches) : ne se monte QUE s'il y
  // a vraiment quelque chose à filtrer/afficher — un mot tapé, un filtre, ou
  // « Voir tout » explicite. Ouvrir le champ de recherche seul (searchOpen)
  // ne suffit pas : ça évite de générer toute la liste non filtrée dès le
  // premier tap, avant même que l'utilisateur ait tapé quoi que ce soit.
  const mobileTiles =
    active === "all" && activeThemes.size === 0 && !hasQuery && !browseAll;

  // Header uniquement : dès l'ouverture de la recherche (avant même de taper),
  // on bascule sur le header compact (flèche retour + champ inline) et on n'en
  // bouge plus tant qu'elle reste ouverte. Sans ça, `mobileTiles` (qui doit
  // rester piloté par `hasQuery` pour le corps de page, cf. plus bas) bascule
  // pile au 2ᵉ caractère tapé, démonte le <SearchInput> de son 1er
  // emplacement pour le remonter ailleurs dans l'arbre, et fait perdre le
  // focus/curseur en pleine frappe — d'où l'impression que la recherche
  // « saute » après 2 lettres.
  const headerMobileTiles = mobileTiles && !searchOpen;

  // Recherche affichée dans le flux dédié (tuile « Recherche », onglet
  // « Explorer », ou « Voir tout ») — pas pendant la navigation par
  // rubrique, où elle n'apporte rien et prend de la place.
  const showHeaderSearch = browseAll || searchOpen;

  // Rubriques les plus fournies toutes catégories confondues, pour la section
  // « Sous-catégories populaires » de l'accueil (grille des 8 catégories).
  const topRubriques = useMemo(() => {
    return Object.entries(themeCountsAll)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, count]) => {
        const r = RUBRIQUE_MAP[key];
        return r ? { key: r.key, label: r.label, emoji: r.emoji, count } : null;
      })
      .filter((t): t is { key: string; label: string; emoji: string; count: number } => t !== null);
  }, [themeCountsAll]);

  const breadcrumb =
    activeThemeLabel ??
    (active !== "all"
      ? { key: active, emoji: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].emoji, label: CATEGORY_MAP[active as keyof typeof CATEGORY_MAP].label }
      : { key: "all", emoji: "✨", label: "Tout" });

  // Verrou Premium désactivé (accès libéré pour tous) : les fiches restent
  // marquées 🔒 Premium (badges) mais le paywall qui masquait le contenu est retiré.
  const activeCategoryLocked = false;

  function renderSidebarTree(catKey: string) {
    const cats = SUBCATEGORIES[catKey as keyof typeof SUBCATEGORIES];
    if (!cats) return null;

    function rubriqueRow(t: { key: string; label: string; emoji: string }) {
      const isSelected = activeThemes.has(t.key);
      const locked = PREMIUM_RUBRIQUE_KEYS.has(t.key);
      return (
        <div key={t.key}>
          <button
            onClick={() => toggleTheme(t.key)}
            aria-pressed={isSelected}
            className={`w-full flex items-center justify-between gap-2 pl-6 pr-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
              isSelected ? "bg-primary-tint text-primary-deep font-semibold" : "text-ink hover:bg-surface-2"
            }`}
          >
            <span className="truncate">
              {t.emoji} {t.label} {locked && <span aria-hidden>🔒</span>}
            </span>
            <span className="text-[11px] font-bold opacity-60 shrink-0">{themeCounts[t.key] || 0}</span>
          </button>
        </div>
      );
    }
    const expanded = expandedInSidebar.has(catKey);
    const visibleEntries = expanded ? cats : cats.slice(0, SIDEBAR_VISIBLE_RUBRIQUES);
    const hiddenCount = cats.length - visibleEntries.length;

    return (
      <div className="pb-1.5">
        {visibleEntries.map((entry) => (
          <div key={entry.key}>{rubriqueRow(entry)}</div>
        ))}
        {hiddenCount > 0 && (
          <button
            onClick={() => toggleSidebarExpand(catKey)}
            className="w-full text-left pl-6 pr-2 py-1.5 text-[12.5px] font-semibold text-primary-deep hover:underline"
          >
            + {hiddenCount} autres rubriques
          </button>
        )}
        {expanded && cats.length > SIDEBAR_VISIBLE_RUBRIQUES && (
          <button
            onClick={() => toggleSidebarExpand(catKey)}
            className="w-full text-left pl-6 pr-2 py-1 text-[12px] text-muted hover:underline"
          >
            Réduire
          </button>
        )}
      </div>
    );
  }

  // Le même calcul sert à la fois à la barre d'onglets mobile (tout en bas
  // de l'écran) et à la nav desktop équivalente en haut de la sidebar : sur
  // desktop, la barre d'onglets mobile est masquée (lg:hidden), donc Carte/
  // Sélections/Mes adresses/Compte doivent rester atteignables autrement.
  // Un onglet = une destination, sans doublon avec l'accueil (réorganisation
  // du 2026-09-25) : la recherche vit dans le champ de l'accueil et la loupe
  // des en-têtes, « Autour de moi » dans la barre des résultats.
  const activeTab: "accueil" | "carte" | "listes" | "favoris" | "profil" | "autre" = !showHome && resultsView === "carte"
    ? "carte"
    : homeMode === "listes"
      ? "listes"
      : homeMode === "favoris"
        ? "favoris"
        : homeMode === "profil"
          ? "profil"
          : showHome && homeMode === "menu"
            ? "accueil"
            : "autre";

  const navItems: { key: Exclude<typeof activeTab, "autre">; label: string; icon: Icon; onClick: () => void }[] = [
    { key: "accueil", label: "Accueil", icon: House, onClick: goHome },
    { key: "carte", label: "Carte", icon: MapTrifold, onClick: openMap },
    { key: "listes", label: "Sélections", icon: Star, onClick: () => leaveResults("listes") },
    { key: "favoris", label: "Mes adresses", icon: Heart, onClick: () => leaveResults("favoris") },
    { key: "profil", label: "Compte", icon: UserCircle, onClick: () => leaveResults("profil") },
  ];

  const sidebarContent = (
    <>
      {/* Nav desktop (équivalent de la barre d'onglets mobile, masquée en
          lg:hidden) : mêmes 5 entrées que la barre du bas (navItems). */}
      <div className="p-2 border-b border-border flex flex-col gap-0.5">
        {navItems.map(({ key, label, icon: ItemIcon, onClick }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={onClick}
              aria-pressed={isActive}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-semibold text-left transition-colors ${
                isActive ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"
              }`}
            >
              <ItemIcon size={18} weight={isActive ? "fill" : "regular"} aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
      {/* Zone : colonne verticale (activable dans la sidebar / le tiroir) */}
      <div className="px-3 pt-3 pb-2.5 border-b border-border">
        <div className="text-[11px] font-bold uppercase tracking-wide text-muted/80 mb-1.5 px-1">
          📍 Zone
        </div>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setActiveZone(null)}
            aria-pressed={activeZone === null}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-left transition-colors ${
              activeZone === null ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"
            }`}
          >
            <span>📍 Toute l&apos;île</span>
          </button>
          {ZONES.map((z) => (
            <button
              key={z.key}
              onClick={() => toggleZone(z.key)}
              aria-pressed={activeZone === z.key}
              className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium text-left transition-colors ${
                activeZone === z.key ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"
              }`}
            >
              <span>
                {z.emoji} {z.label}
              </span>
              <span className="text-[11px] font-bold opacity-70">{zoneCounts[z.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>
      {activeThemeLabel && (
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-3 py-2.5 mb-1.5">
          <div className="flex items-center justify-between gap-2 bg-primary-tint text-primary-deep rounded-lg px-2.5 py-1.5">
            <span className="text-[12.5px] font-semibold truncate">
              {activeThemeLabel.emoji} {activeThemeLabel.label}
            </span>
            <button
              onClick={() => (activeThemeLabel.key ? clearThemeFilter(activeThemeLabel.key) : setActiveThemes(new Set()))}
              aria-label="Retirer ce filtre"
              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-primary-deep hover:bg-white/60 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div className="px-2 pb-4">
        <button
          onClick={() => selectCategory("all")}
          aria-pressed={active === "all"}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
            active === "all" ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"
          }`}
        >
          <span>🎯 Tout</span>
          <span className="text-[12px] font-bold opacity-75">{businesses.length}</span>
        </button>
        {CATEGORIES.map((c) => {
          const isOpen = active === c.key;
          const isEmpty = (counts[c.key] || 0) === 0;
          return (
            <div key={c.key} className="mt-0.5">
              <button
                onClick={() => !isEmpty && selectCategory(c.key)}
                aria-pressed={isOpen}
                disabled={isEmpty}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[14px] font-semibold transition-colors ${
                  isOpen
                    ? "bg-primary text-on-primary"
                    : isEmpty
                    ? "text-muted/50 cursor-default"
                    : "text-ink hover:bg-surface-2"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isOpen ? "#fff" : c.color }}
                  />
                  <span className="truncate">{c.label}</span>
                  {PREMIUM_CATEGORY_KEYS.has(c.key) && <span aria-hidden>🔒</span>}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[12px] font-bold opacity-75">{counts[c.key] || 0}</span>
                  {!isEmpty && (
                    <span className={`text-[10px] transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                  )}
                </span>
              </button>
              {isOpen && renderSidebarTree(c.key)}
            </div>
          );
        })}
      </div>
      <p className="px-4 pb-4 text-[11.5px] leading-[1.5] text-muted border-t border-border pt-3">
        1 seul niveau de clic pour tout voir — plus de double scroll horizontal.
      </p>
    </>
  );

  // « Autour de moi » + sélecteur de zone : intégrés dans la barre de
  // résultats de l'écran Explorer (plus de bandeau flottant dédié — le retour
  // se fait via l'onglet Accueil / le logo, et la navigation en tuiles garde
  // ses propres tuiles cliquables).
  const zoneItems = [
    { key: "", label: "Toute", icon: "toute-lile" },
    ...ZONES.map((z) => ({ key: z.key, label: z.label, icon: z.key })),
  ];
  const zoneControls = (
    <div className="flex items-stretch gap-1.5 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={toggleNearMe}
        aria-pressed={nearMe}
        title="Autour de moi"
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold shrink-0 transition-colors ${
          nearMe ? "bg-primary text-on-primary" : "bg-surface-2 text-ink"
        }`}
      >
        <MapPin size={14} weight={nearMe ? "fill" : "regular"} aria-hidden />
        {geoStatus === "loading" ? "Localisation…" : "Autour de moi"}
      </button>
      <div className="relative min-w-0 shrink-0">
        <button
          ref={zonePickerBtnRef}
          onClick={() => setZonePickerOpen((o) => !o)}
          aria-expanded={zonePickerOpen}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold min-w-0 transition-colors ${
            !nearMe && activeZone ? "bg-primary text-on-primary" : "bg-surface-2 text-ink"
          }`}
        >
          {(() => {
            const I = iconForKey(!nearMe && activeZone ? activeZone : "toute-lile");
            return I ? <I size={14} weight={!nearMe && activeZone ? "fill" : "regular"} aria-hidden /> : null;
          })()}
          <span className="truncate max-w-[130px]">
            {!nearMe && activeZone ? ZONES.find((z) => z.key === activeZone)?.label : "Par zone"}
          </span>
        </button>
        {zonePickerOpen && zonePickerPos && typeof document !== "undefined" &&
          createPortal(
            <div
              ref={zonePickerPanelRef}
              style={{ position: "fixed", top: zonePickerPos.top, left: zonePickerPos.left, width: 220 }}
              className="z-50 max-h-[320px] overflow-y-auto rounded-card border border-border bg-surface shadow-pop p-1.5"
            >
              {zoneItems.map((z) => {
                const active = !nearMe && (activeZone ?? "") === z.key;
                const I = iconForKey(z.icon);
                const n = z.key ? zoneCounts[z.key] || 0 : rows.length;
                return (
                  <button
                    key={z.key || "all"}
                    onClick={() => {
                      setNearMe(false);
                      setActiveZone(z.key || null);
                      setZonePickerOpen(false);
                      if (showHome) setBrowseAll(true);
                    }}
                    aria-pressed={active}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
                      active ? "bg-primary-tint text-primary-deep font-semibold" : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    {I ? <I size={16} weight={active ? "fill" : "regular"} aria-hidden /> : null}
                    <span className="flex-1 truncate">{z.label === "Toute" ? "Toute l'île" : z.label}</span>
                    <span className="text-[11px] font-bold opacity-55 shrink-0">{n}</span>
                  </button>
                );
              })}
            </div>,
            document.body
          )}
      </div>
    </div>
  );
  // « Ouvert maintenant » : sorti de la rangée défilante ci-dessus (il y était
  // tronqué sur mobile, faute de place à côté d'« Autour de moi » + la zone).
  // Traité en bandeau à part entière, sur sa propre ligne pleine largeur pour
  // rester entièrement lisible. État repos volontairement neutre (gris, comme
  // les autres chips inactives) pour trancher nettement avec l'état actif
  // (fond accent plein + switch visuel à droite) : avant, les deux états
  // utilisaient tous les deux un fond teinté accent et se distinguaient trop
  // peu l'un de l'autre.
  const openNowControl = (
    <button
      onClick={() => setOpenNow((v) => !v)}
      aria-pressed={openNow}
      title="Ouvert maintenant"
      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold border-2 transition-colors"
      style={
        openNow
          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" }
          : { background: "var(--surface-2)", borderColor: "transparent", color: "var(--ink)" }
      }
    >
      <Clock size={16} weight={openNow ? "fill" : "regular"} aria-hidden />
      Ouvert maintenant
      <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
        {openNow ? "Activé" : "Désactivé"}
        <span
          aria-hidden
          className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors"
          style={{ background: openNow ? "var(--on-accent)" : "color-mix(in srgb, var(--ink) 25%, transparent)" }}
        >
          <span
            className="absolute h-3 w-3 rounded-full transition-transform"
            style={{
              background: openNow ? "var(--accent)" : "var(--surface)",
              transform: openNow ? "translateX(14px)" : "translateX(2px)",
            }}
          />
        </span>
      </span>
    </button>
  );

  // Barre de navigation principale (5 onglets) fixée tout en bas de l'écran,
  // mêmes entrées que la nav desktop (navItems) : Accueil / Carte /
  // Sélections / Mes adresses / Compte. Un onglet = une destination (cf.
  // activeTab) : plus d'onglet Recherche (champ de l'accueil + loupe des
  // en-têtes) ni Autour de moi (barre des résultats/carte).
  const tabBar = (
    <nav
      aria-label="Navigation principale"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-transparent"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "linear-gradient(180deg, #146b66 0%, #0d4a47 100%)",
        boxShadow: "0 -2px 14px -8px rgba(13, 43, 42, 0.35)",
      }}
    >
      <div className="max-w-[640px] mx-auto grid grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
        {navItems.map(({ key, label, icon: ItemIcon, onClick }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={onClick}
              aria-label={label}
              aria-pressed={isActive}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-xl transition-colors active:scale-[.97] ${
                isActive ? "text-white" : "text-white/60"
              }`}
            >
              <ItemIcon size={22} weight={isActive ? "fill" : "regular"} aria-hidden />
              <span className="text-[10.5px] font-semibold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  // Barre de filtres générique : un menu déroulant par groupe de filtre
  // applicable à la rubrique active (cf. FILTER_GROUPS), plus Prix et Sélection.
  const groupOptionsList: { group: FilterGroup; options: DropdownOption[] }[] = applicableFilterGroups
    .map((g) => {
      const options: DropdownOption[] = g.options
        .filter((o) => (facetCounts.perGroup[g.key]?.[o.key] || 0) > 0)
        .map((o) => {
          const I = iconForKey(o.key);
          return {
            key: o.key,
            label: o.label,
            count: facetCounts.perGroup[g.key][o.key],
            icon: I ? <I size={14} weight="bold" aria-hidden /> : <span aria-hidden>{o.emoji}</span>,
          };
        });
      return { group: g, options };
    })
    .filter((g) => g.options.length > 0);

  const priceOptions: DropdownOption[] = activeRubriques.has("restaurants")
    ? PRICE_RANGES.filter(
        (p) => (facetCounts.price[p.key] || 0) > 0
      ).map((p) => ({ key: p.key, label: `${p.symbol} ${p.label}`, count: facetCounts.price[p.key] }))
    : [];

  // « selection » (coup de cœur/reco Koté Moris) et « kids-friendly » ont leur
  // propre chip image (voir imageBadges ci-dessous), plus visible et cliquable
  // directement qu'enfoui dans le menu déroulant « Sélection » — donc exclus
  // d'ici pour ne pas les dupliquer.
  const badgeOptions: DropdownOption[] = [
    ...BADGE_META.filter(
      (m) => !IMAGE_BADGE_KEYS.has(m.key) && (facetCounts.badge[m.key] || 0) > 0
    ).map((m) => ({
      key: m.key,
      label: m.label,
      count: facetCounts.badge[m.key],
      icon: <span aria-hidden>{m.emoji}</span>,
    })),
    // « 4 fleurs » : les tables notées au maximum sur les 4 critères (goût,
    // qualité-prix, cadre, accueil). Dérivé de koteMorisRatings, pas un vrai
    // champ b.badge — géré à part (matchesFleurs4) dans le filtre.
    ...((facetCounts.badge["fleurs4"] || 0) > 0
      ? [
          {
            key: "fleurs4",
            label: "4 fleurs",
            count: facetCounts.badge["fleurs4"],
            icon: <span aria-hidden>🌸</span>,
          },
        ]
      : []),
  ];

  // « shortLabel » : affiché dans la chip (longueur proche entre les deux
  // badges pour un rendu à largeur égale sans troncature) ; « label » complet
  // gardé pour le title/tooltip.
  const imageBadges: { key: string; img: string; label: string; shortLabel: string }[] = [
    { key: "selection", img: "/badge-selection.png", label: "Recommandé Koté Moris", shortLabel: "Recommandé" },
    { key: "kids-friendly", img: "/badge-kids.png", label: "Kids friendly", shortLabel: "Kids friendly" },
  ].filter((m) => (facetCounts.badge[m.key] || 0) > 0);

  const hasFacets = groupOptionsList.length > 0 || priceOptions.length > 0 || badgeOptions.length > 0;
  // URL de l'alerte "cette recherche" pour l'agenda : thèmes (rubriques agenda
  // sélectionnées) + filtres transversaux actifs (type/nature d'événement).
  const agendaAlertHref = useMemo(() => {
    const themes = [...activeThemes].filter((k) => k !== UNCLASSIFIED);
    const filters = Object.values(facetGroups).flatMap((set) => [...set]);
    const params = new URLSearchParams({ type: "event" });
    if (themes.length > 0) params.set("themes", themes.join(","));
    if (filters.length > 0) params.set("filters", filters.join(","));
    return `/mon-compte/alertes?${params.toString()}`;
  }, [activeThemes, facetGroups]);
  // Rangée dédiée aux badges image (Recommandé / Kids friendly) : largeur
  // égale entre les deux boutons (flex-1 + texte centré) plutôt qu'une largeur
  // qui suit la longueur du libellé, et séparée de la rangée des menus
  // déroulants (Cuisine, Ambiance, Prix…) pour rester bien lisible.
  const imageBadgesRow = imageBadges.length > 0 ? (
    <div className="mb-2 flex items-stretch gap-2">
      {imageBadges.map((m) => {
        const isActive = facetBadges.has(m.key);
        return (
          <button
            key={m.key}
            onClick={() => toggleInSet(setFacetBadges, m.key)}
            aria-pressed={isActive}
            title={m.label}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
              isActive ? "bg-primary text-on-primary" : "bg-surface-2 text-ink"
            }`}
          >
            <img src={m.img} alt="" aria-hidden className="h-6 w-6 rounded-full shrink-0" />
            <span className="truncate">{m.shortLabel}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  const restoFilterBar = (activeRubriques.size > 0 || agendaBrowseAll) && hasFacets ? (
    <div className="mb-3 border-b border-border pb-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {active === "agenda" && (
        <Link
          href={agendaAlertHref}
          className="shrink-0 text-[12.5px] font-semibold text-primary-deep hover:underline"
        >
          🔔 Créer une alerte
        </Link>
      )}
      {badgeOptions.length > 0 && (
        <FilterDropdown
          label="Sélection"
          options={badgeOptions}
          selected={facetBadges}
          onToggle={(k) => toggleInSet(setFacetBadges, k)}
          onClear={() => setFacetBadges(new Set())}
        />
      )}
      {groupOptionsList.map(({ group, options }) => (
        <FilterDropdown
          key={group.key}
          label={group.label}
          options={options}
          selected={facetGroups[group.key] ?? new Set()}
          onToggle={(k) => toggleFacetGroup(group.key, k)}
          onClear={() => clearFacetGroup(group.key)}
        />
      ))}
      {priceOptions.length > 0 && (
        <FilterDropdown
          label="Prix"
          options={priceOptions}
          selected={facetPrices}
          onToggle={(k) => toggleInSet(setFacetPrices, k)}
          onClear={() => setFacetPrices(new Set())}
        />
      )}
      {facetActive && (
        <button
          onClick={resetFacets}
          className="shrink-0 text-[12.5px] font-semibold text-primary-deep hover:underline"
        >
          Réinitialiser
        </button>
      )}
    </div>
  ) : null;

  return (
    <div className="app min-h-screen flex flex-col">
      {/* En-tête « Lagon » : bandeau clair poulpe, logo clair + recherche.
          Le décor de nature mauricienne (montagne, lagon) est déjà intégré
          à l'image du bandeau clair (cf. Logo light) ; ailleurs le header
          reste blanc et compact pour bien séparer le contenu qui défile
          en dessous. */}
      <header
        // Hors accueil : ni ombre ni bordure, le bandeau se fond dans le
        // fond de page (cf. fondu en bas de BannerBackdrop).
        className={`relative z-30 overflow-hidden bg-bg ${
          showHome && homeMode === "menu" ? "border-b border-transparent" : ""
        }`}
      >
        {showHome && homeMode === "menu" ? (
          <div className="relative max-w-[820px] lg:max-w-[520px] mx-auto">
            {/* Bandeau d'accueil : illustration pleine (cf. Logo light tags),
                affichée dans son intégralité. La bulle de recherche est une
                simple superposition (position absolue, calée en % sur la
                pastille dessinée dans l'image) directement dessus — le reste
                de l'écran d'accueil arrive en dessous, au scroll. */}
            {/* Illustration et cartes empilées dans la même cellule de grille :
                la hauteur du bloc = la plus grande des deux, donc les cartes
                peuvent dépasser sous l'illustration (et repousser la suite de
                l'accueil) au lieu d'être rognées. */}
            <div className="grid w-full">
              <div className="relative [grid-area:1/1]">
                <Logo light tags />
                {/* Joint visuel : fondu au raz du bas de l'illustration vers le
                    fond de page, pour que la transition avec la suite de
                    l'accueil (Mes adresses, etc.) ne soit pas une coupure nette. */}
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  style={{ bottom: "-1%", height: "12%", background: "linear-gradient(to bottom, transparent 0%, var(--bg) 100%)" }}
                />
              </div>
              {/* « Choisis ta façon de rechercher » (option C retenue le
                  2026-09-25, à la place des 3 cartes illustrées jugées « trop
                  IA ») : un vrai champ de recherche, puis 3 accès directs
                  (Catégories / Expérience / Carte), style plat turquoise comme
                  le reste de l'appli. Superposé sur l'illustration sous le
                  logo, à ~34% de la hauteur de bandeau-kotemoris-accueil-v10.png
                  (941×1670) — soit 60,3% de sa largeur, d'où le paddingTop (un %
                  de padding se rapporte à la largeur). */}
              <div className="relative z-20 [grid-area:1/1] self-start px-[7%] pb-5" style={{ paddingTop: "60.3%" }}>
                <div className="-mx-2 lg:mx-0 text-center mb-3">
                  <p className="text-[14px] font-extrabold tracking-[.14em] uppercase text-primary-deep">
                    Choisis ta façon de rechercher
                  </p>
                  <div className="mx-auto mt-1.5 h-[2px] w-2/3 rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} aria-hidden />
                </div>

                {/* 3 tuiles égales (disposition A retenue le 2026-09-25) :
                    grande icône « maison » au-dessus, libellé dessous. Mot-clé
                    ouvre l'écran de recherche, champ focalisé (focusSearch).
                    La carte a son propre onglet dans la barre du bas (openMap).
                    Icônes fournies par la cliente (planche de 4, découpées en
                    PNG 256×256 à coins transparents : public/recherche-icone-*). */}
                <div className="-mx-3 lg:mx-0 grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { key: "categorie", label: "Catégories", img: "/recherche-icone-categories.png" },
                      { key: "mot", label: "Mot-clé", img: "/recherche-icone-motcle.png" },
                      { key: "experience", label: "Expérience", img: "/recherche-icone-experience.png" },
                    ] as const
                  ).map((b) => {
                    const on = b.key === "experience" && experienceOpen;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => {
                          if (b.key === "mot") {
                            focusSearch();
                          } else if (b.key === "categorie") {
                            setHomeMode("categories");
                            setHomeCategory(null);
                            setHomeSubRubrique(null);
                            window.scrollTo({ top: 0 });
                          } else {
                            setExperienceOpen((o) => !o);
                          }
                        }}
                        aria-expanded={b.key === "experience" ? experienceOpen : undefined}
                        // Sans encart (demande du 2026-09-25) : icône posée
                        // directement sur l'illustration ; libellé sur une
                        // pastille blanche en verre dépoli (un simple halo ne
                        // suffisait pas sur le ciel/les montagnes) ; anneau
                        // turquoise autour de l'icône quand Expérience est déplié.
                        className="flex flex-col items-center gap-1.5 text-[16px] font-extrabold text-primary-deep active:scale-[.96] transition-transform"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={b.img}
                          alt=""
                          aria-hidden
                          className={`w-[108px] h-[108px] rounded-[24%] ${on ? "ring-[3px] ring-primary" : ""}`}
                          // Fondu dans le décor : fond des tuiles rendu
                          // semi-transparent dans les PNG (objets opaques) +
                          // léger flou de ce qu'il y a derrière, sans ombre.
                          style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
                        />
                        <span
                          className="px-3 py-1 rounded-pill text-[12px] tracking-[.12em] uppercase leading-tight whitespace-nowrap text-white"
                          style={{
                            background: "color-mix(in srgb, var(--primary-deep) 88%, transparent)",
                            boxShadow: "0 2px 8px -3px rgba(6,50,56,.5)",
                          }}
                        >
                          {b.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Deux usages de /mon-plan : « Trouver un lieu » d'abord (le
                    besoin le plus courant), puis le programme complet. */}
                {experienceOpen && (
                  <div className="mt-2 space-y-2">
                    {(
                      [
                        { href: "/mon-plan", icon: MapPin, title: "Trouver un lieu", sub: "Ta thématique, tes critères, une liste d'adresses" },
                        { href: "/mon-plan?mode=plan", icon: Sparkle, title: "Plan complet", sub: "Un programme sur mesure selon ton groupe, ta zone et ton temps" },
                      ] as const
                    ).map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="flex items-center gap-3 rounded-2xl p-3 no-underline text-ink bg-surface active:scale-[.98] transition-transform"
                        style={{ boxShadow: "0 6px 16px -8px rgba(6,50,56,.35)" }}
                      >
                        <span className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary-tint text-primary-deep" aria-hidden>
                          <l.icon size={20} weight="duotone" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-extrabold leading-tight">{l.title}</span>
                          <span className="block text-[11.5px] text-muted leading-snug mt-0.5">{l.sub}</span>
                        </span>
                        <span className="shrink-0 text-[18px] font-bold text-primary-deep" aria-hidden>›</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : homeMode === "favoris" ? (
          // Bandeau dédié « Mes adresses » (favoris/à tester/testé) : même
          // bandeau illustré Koté Moris que les autres écrans hors accueil
          // (cf. bandeau-kotemoris-resultats.png), avec flèche retour +
          // recherche. Le titre vit sur une ligne à part, sous l'image — le
          // superposer directement sur le wordmark cuit dans l'illustration
          // rendait les deux textes illisibles, imbriqués l'un dans l'autre.
          <>
            <div
              className="relative flex items-center gap-2 px-4 lg:px-5 h-[88px] overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0a4d53 0%, #0f7a80 45%, #128a8f 100%)" }}
            >
              <BannerBackdrop />
              <button
                onClick={goHome}
                aria-label="Retour à l'accueil"
                className="relative shrink-0 w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-white active:scale-[.95] transition-transform"
              >
                <ArrowLeft size={19} weight="bold" aria-hidden />
              </button>
              <div className="relative flex-1 min-w-0">
                {!searchOpen && (
                  <button
                    onClick={focusSearch}
                    aria-label="Rechercher"
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 text-white active:scale-[.95] transition-transform"
                  >
                    <MagnifyingGlass size={18} weight="bold" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            <div className="relative px-4 lg:px-5 pb-3 max-w-[820px] mx-auto leading-tight">
              <p className="m-0 text-ink text-[19px] font-bold">Mes adresses</p>
              <p className="m-0 text-muted text-[12.5px]">Favoris, à tester et testées</p>
            </div>
          </>
        ) : headerMobileTiles ? (
          // Bandeau illustré Koté Moris (mêmes visuels partout hors accueil),
          // avec flèche retour + recherche ; la loupe est calée juste à côté de la flèche retour, sur le bandeau.
          <div
            className="relative flex items-center gap-2 px-4 lg:px-5 h-[88px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0a4d53 0%, #0f7a80 45%, #128a8f 100%)" }}
          >
            <BannerBackdrop />
            <button
              onClick={goBackFromResults}
              disabled={!canGoBack}
              aria-label="Retour"
              className={`relative shrink-0 w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:scale-[.95] transition-transform ${
                canGoBack ? "text-white" : "text-white/40"
              }`}
            >
              <ArrowLeft size={19} weight="bold" aria-hidden />
            </button>
            {!showHeaderSearch && (
              <button
                onClick={focusSearch}
                aria-label="Rechercher"
                className="relative shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/15 text-white active:scale-[.95] transition-transform"
              >
                <MagnifyingGlass size={18} weight="bold" aria-hidden />
              </button>
            )}
          </div>
        ) : (
          // Sur l'écran de résultats (liste/carte + barre de filtres), même
          // bandeau illustré Koté Moris que les autres écrans hors accueil,
          // avec flèche retour + recherche (le nom « Koté Moris » vit dans
          // l'illustration elle-même, plus besoin de le recréer en texte ici).
          <div
            className="relative flex items-center gap-2 px-4 lg:px-5 h-[88px] overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0a4d53 0%, #0f7a80 45%, #128a8f 100%)" }}
          >
            <BannerBackdrop />
            <button
              onClick={goBackFromResults}
              disabled={!canGoBack}
              aria-label="Retour"
              className={`relative shrink-0 w-9 h-9 -ml-1 rounded-full flex items-center justify-center active:scale-[.95] transition-transform ${
                canGoBack ? "text-white" : "text-white/40"
              }`}
            >
              <ArrowLeft size={19} weight="bold" aria-hidden />
            </button>
            <div className="relative flex-1 min-w-0">
              {!searchOpen && (
                <button
                  onClick={focusSearch}
                  aria-label="Rechercher"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/15 text-white active:scale-[.95] transition-transform"
                >
                  <MagnifyingGlass size={18} weight="bold" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}
        {showHeaderSearch && headerMobileTiles && (
          <div className="relative max-w-[1400px] mx-auto px-5 pb-2.5">
            <div className="max-w-[640px]">
              {searchOpen ? (
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Rechercher une activité, un lieu, un nom…"
                  autoFocus={focusSearchOnMount}
                />
              ) : (
                // « Autour de moi »/« Voir tout » sans recherche explicite : juste
                // la loupe, pour ne pas déployer un encart de texte qui prend de
                // la place tant qu'on n'a pas vraiment l'intention de chercher.
                <button
                  onClick={focusSearch}
                  aria-label="Rechercher"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-2 text-ink active:scale-[.95] transition-transform"
                >
                  <MagnifyingGlass size={18} weight="bold" aria-hidden />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-[1400px] w-full mx-auto lg:flex min-h-0">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-[270px] shrink-0 border-r border-border overflow-y-auto sticky top-0 max-h-[calc(100vh)]">
          {sidebarContent}
        </aside>

        <div className="flex-1 min-w-0 px-4 lg:px-5 py-3 pb-24 lg:pb-8">
          {/* Champ de recherche : une fois `searchOpen`, il vit ici (dans
              l'espace clair sous le bandeau) plutôt que dans le bandeau teal
              du header — plus lisible, et un seul emplacement de montage
              (gate uniquement sur `searchOpen`, jamais sur `mobileTiles`)
              pour ne pas démonter/remonter le champ en pleine frappe (cf.
              `headerMobileTiles` plus haut). */}
          {searchOpen && (
            <div className="max-w-[640px] mx-auto mb-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Rechercher une activité, un lieu, un nom…"
                autoFocus={focusSearchOnMount}
              />
            </div>
          )}

          {/* Accueil : barre de recherche (point d'entrée vers le mode
              recherche/résultats), rangée de catégories, coups de cœur de la
              rédaction et bandeau carte — inspiré du rendu fourni par la
              cliente. Remplace l'ancien menu à 4 tuiles (la tuile « Recherche »
              a été retirée : la recherche vit désormais ici en permanence). */}
          {showHome && homeMode === "menu" && (
            <div className="max-w-[720px] lg:max-w-[1100px] mx-auto pb-6">
              {/* Espace de recherche : superposé sur l'illustration, centré au
                  niveau des bateaux (cf. header, juste au-dessus). */}

              {/* Nos sélections : un seul carrousel (réorganisation du
                  2026-09-25) — sélections vedettes (coups de cœur, kids
                  friendly) en tête, puis les listes de data/selections.ts. Il
                  remplace les tuiles « Mes adresses » / « Nos sélections »
                  (onglets dédiés dans la barre du bas), le bloc « Avantages
                  Premium » (bloc Premium unique plus bas) et les sections
                  coups de cœur / kids friendly séparées. */}
              <div className="flex items-center justify-between mt-2 mb-1">
                <h2 className="text-[16px] font-bold text-ink">Nos sélections</h2>
                <button
                  onClick={() => setHomeMode("listes")}
                  className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  Voir tout ›
                </button>
              </div>
              <p className="text-[12.5px] text-muted mb-2.5">
                Envie d&apos;inspiration ? On a déjà fait le tri pour toi.
              </p>
              <details open className="group mb-4 rounded-2xl border-2 border-primary bg-white px-3.5 py-3 shadow-card text-[12.5px] text-muted">
                <summary className="cursor-pointer list-none text-[15px] font-bold text-primary-deep flex items-center justify-between">
                  Comment lire nos notes ?
                  <span className="transition-transform group-open:rotate-90">›</span>
                </summary>
                <div className="mt-3 space-y-2.5 leading-snug">
                  {/* 3 cartes teintées (même grammaire que « À la une » plus bas) :
                      une couleur d'accent par thématique de notation, pour que
                      l'œil associe tout de suite fleurs = food, badge Reco =
                      hors food, badge Kids = transversal — sans casser
                      l'harmonie visuelle (même forme de carte, même mise en page). */}
                  <div
                    className="rounded-xl p-2.5"
                    style={{ background: "color-mix(in srgb, var(--flower-gout) 12%, var(--surface))" }}
                  >
                    <p
                      className="text-[10.5px] font-bold uppercase tracking-wide"
                      style={{ color: "var(--flower-gout-stroke)" }}
                    >
                      Bars • restaurants • cafés
                    </p>
                    <p className="mt-0.5">Une <span className="font-semibold text-ink">fleur</span> de couleur pour chaque critère validé et approuvé par Koté Moris.</p>
                    <div className="mt-2 flex flex-nowrap items-center gap-x-3 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {([["gout", "Goût"], ["qualitePrix", "Qualité-prix"], ["cadre", "Cadre"], ["accueil", "Accueil et service"]] as const).map(([k, label]) => (
                        <span key={k} className="inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap text-[12.5px] text-ink">
                          <CriteriaFlowers ratings={{ [k]: 5 }} size={18} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    className="flex items-start gap-3 rounded-xl p-2.5"
                    style={{ background: `color-mix(in srgb, ${SELECTION_COLOR} 10%, var(--surface))` }}
                  >
                    <SpecialBadge variant="selection" className="h-11 w-11 shrink-0" />
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: SELECTION_COLOR }}>
                        Activités • shopping • sport
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-ink">Recommandé Koté Moris</p>
                      <p>Une adresse que la rédaction Koté Moris recommande, testée et approuvée.</p>
                    </div>
                  </div>
                  <div
                    className="flex items-start gap-3 rounded-xl p-2.5"
                    style={{ background: `color-mix(in srgb, ${KIDS_COLOR} 10%, var(--surface))` }}
                  >
                    <SpecialBadge variant="kids-friendly" className="h-11 w-11 shrink-0" />
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: KIDS_COLOR }}>
                        Sur toutes les fiches
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-ink">Badge Kids friendly</p>
                      <p>Un lieu où les enfants sont les bienvenus et bien accueillis.</p>
                    </div>
                  </div>
                </div>
              </details>
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 mb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {homeSelections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setHomeMode("listes"); setSelectedListId(s.id); }}
                    className="relative text-left shrink-0 w-[130px] aspect-[4/5] rounded-2xl overflow-hidden shadow-card active:scale-[.98] transition-transform"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photoUrl}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                    />
                    <span className="absolute inset-x-0 bottom-0 p-2.5">
                      <span className="block font-serif text-[12px] font-semibold leading-tight text-white line-clamp-2">
                        {s.title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {/* À la une : trois lignes — recommandées (badge Reco), kids friendly
                  (badge Kids) et tables fleuries (fleurs). Les fiches à fleurs n'ont
                  pas de badge Reco : les fleurs suffisent. */}
              {(() => {
                const rows = [
                  {
                    key: "fleurs",
                    tint: "var(--flower-gout)",
                    title: "Les tables recommandées",
                    badge: (
                      <span className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-full bg-surface shadow-sm">
                        <CriteriaFlowers ratings={{ gout: 5 }} size={26} />
                      </span>
                    ),
                    hint: "Bars, restaurants et cafés testés par la rédaction. Une fleur par critère validé et approuvé : goût, qualité-prix, cadre, accueil et service.",
                    list: tablesFleuries,
                    onAll: () => {
                      setNearMe(false);
                      setBrowseAll(true);
                      setHomeCategory(null);
                      setActiveThemes(new Set());
                      setFacetBadges(new Set(["fleurs"]));
                      setResultsView("liste");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                  },
                  {
                    key: "reco",
                    tint: SELECTION_COLOR,
                    title: "Nos coups de cœur",
                    badge: <SpecialBadge variant="selection" className="h-12 w-12 shrink-0" />,
                    hint: "Testées et approuvées par la rédaction : des lieux, activités et sorties qu'on te conseille les yeux fermés.",
                    list: coupsDeCoeur.filter((b) => highlightedCriteria(b).length === 0),
                    onAll: () => { setBrowseAll(true); setFacetBadges(new Set(["selection"])); },
                  },
                  {
                    key: "kids",
                    tint: KIDS_COLOR,
                    title: "Kids friendly",
                    badge: <SpecialBadge variant="kids-friendly" className="h-12 w-12 shrink-0" />,
                    hint: "Des lieux où les enfants sont les bienvenus : activités, balades, sorties et tables adaptées aux familles.",
                    list: kidsAdresses,
                    onAll: () => {
                      setNearMe(false);
                      setBrowseAll(true);
                      setHomeCategory(null);
                      setActiveThemes(new Set(["kids-friendly"]));
                      setResultsView("liste");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                  },
                ].filter((r) => r.list.length > 0);
                if (rows.length === 0) return null;
                return (
                  <div id="accueil-coups-de-coeur" className="mb-7 space-y-4">
                    <div>
                      <h2 className="text-[16px] font-bold text-ink">À la une</h2>
                      <p className="text-[12.5px] text-muted">
                        {preferences.interests.length > 0 || preferences.hasKids
                          ? "Une sélection pensée pour toi, d'après tes préférences (Mon compte)."
                          : "Nos adresses à ne pas manquer, par type."}
                      </p>
                    </div>
                    {rows.map((r) => (
                      <div
                        key={r.key}
                        className="p-3 rounded-2xl shadow-card"
                        style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${r.tint} 38%, var(--surface)) 0%, color-mix(in srgb, ${r.tint} 6%, var(--surface)) 100%)` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {r.badge}
                            <div className="min-w-0">
                              <h3 className="text-[14.5px] font-bold text-ink">{r.title}</h3>
                              <p className="text-[11.5px] text-muted leading-snug">{r.hint}</p>
                            </div>
                          </div>
                          {r.onAll && (
                            <button onClick={r.onAll} className="shrink-0 text-[13px] font-semibold text-primary-deep active:scale-[.98]">
                              Voir tout ›
                            </button>
                          )}
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {r.list.slice(0, 12).map((b) => (
                            <div
                              key={b.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => selectFromCard(b.id)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectFromCard(b.id); }}
                              className="relative shrink-0 w-[160px] rounded-card overflow-hidden bg-surface border border-border shadow-card text-left cursor-pointer active:scale-[.98] transition-transform"
                            >
                              <div className="relative h-[110px] bg-primary-tint flex items-center justify-center">
                                {b.photoUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={b.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                )}
                                <span
                                  className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-surface/90 shadow-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FavoriteButton id={b.id} size={12.5} />
                                </span>
                              </div>
                              <div className="p-2.5">
                                <p className="text-[13px] font-bold text-ink truncate">{displayName(b.name)}</p>
                                <p className="text-[11.5px] text-muted truncate">
                                  {CATEGORY_MAP[b.category].label} • {displayCity(b.address)}
                                </p>
                                {r.key === "fleurs" && (
                                  <div className="mt-1 h-[16px]">
                                    <CriteriaFlowers business={b} size={15} className="inline-flex items-center gap-0.5" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {newBusinesses.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkle size={20} weight="fill" className="text-primary-deep shrink-0" aria-hidden />
                    <h2 className="text-[16px] font-bold text-ink">Nouveautés en avant-première</h2>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 mb-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {newBusinesses.slice(0, 12).map((b) => (
                      <div
                        key={b.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectFromCard(b.id)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") selectFromCard(b.id); }}
                        className="relative shrink-0 w-[160px] rounded-card overflow-hidden bg-surface border border-border shadow-card text-left cursor-pointer active:scale-[.98] transition-transform"
                      >
                        <div className="relative h-[110px] bg-primary-tint flex items-center justify-center">
                          {b.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            (() => {
                              const FallbackIcon = iconForKey(b.category);
                              return FallbackIcon ? (
                                <FallbackIcon size={30} weight="duotone" className="text-primary-deep opacity-50" aria-hidden />
                              ) : null;
                            })()
                          )}
                          <span
                            className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-surface/90 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FavoriteButton id={b.id} size={12.5} />
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="text-[13px] font-bold text-ink truncate">{displayName(b.name)}</p>
                          <p className="text-[11.5px] text-muted truncate">
                            {CATEGORY_MAP[b.category].label} • {displayCity(b.address)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}


              {/* Premium : Événements puis Seconde main (refonte du 2026-09-26) —
                  encart teinté + badge rond façon « À la une », avec un
                  carrousel de cartes photo 4:5 façon « Nos sélections ». */}
              <section className="mt-7" aria-labelledby="accueil-premium-titre">
                <div className="flex items-center justify-between mb-2.5">
                  <h2 id="accueil-premium-titre" className="flex items-center gap-1.5 text-[16px] font-bold text-ink">
                    <Crown size={18} weight="fill" className="text-[#e0a100]" aria-hidden />
                    Koté Moris Premium
                  </h2>
                  {!canSeeEventDetail && (
                    <Link href="/mon-compte/upgrade" className="text-[13px] font-semibold text-primary-deep no-underline">
                      Voir les avantages ›
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div
                    id="accueil-evenements"
                    className="p-3 rounded-2xl shadow-card"
                    style={{ background: "linear-gradient(135deg, #ffd3df 0%, #fff4f7 100%)" }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden
                          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white shadow-sm"
                          style={{ background: "#D8497A" }}
                        >
                          <CalendarBlank size={22} weight="fill" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-tight" style={{ color: "#7a2345" }}>Événements à venir</h3>
                          <p className="text-[11.5px] leading-snug" style={{ color: "#a8365f" }}>Concerts, festivals, sorties près de chez toi</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (canSeeEventDetail) {
                            setHomeMode("categories");
                            setHomeCategory("agenda");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          } else {
                            window.location.href = "/mon-compte/upgrade";
                          }
                        }}
                        className="shrink-0 text-[13px] font-semibold active:scale-[.98]"
                        style={{ color: "#a8365f" }}
                      >
                        Voir tout ›
                      </button>
                    </div>
                    {upcomingEvents.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {upcomingEvents.map((b) => {
                          const rubrique = (b.themes || [])[0];
                          const photo =
                            b.photoUrl ??
                            (AGENDA_GROUPS.find((g) => g.key === rubrique) ?? AGENDA_GROUPS[0]).photo;
                          const shortDate = b.eventStartDate
                            ? new Date(b.eventStartDate + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                            : null;
                          return (
                            <button
                              key={b.id}
                              onClick={() => openEvent(b.id)}
                              className="relative text-left shrink-0 w-[130px] aspect-[4/5] rounded-2xl overflow-hidden shadow-card bg-surface active:scale-[.98] transition-transform"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                              <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                              />
                              {shortDate && (
                                <span
                                  className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-pill bg-white text-[10.5px] font-bold shadow-sm"
                                  style={{ color: "#a8365f" }}
                                >
                                  {shortDate}
                                </span>
                              )}
                              {!canSeeEventDetail && (
                                <span
                                  aria-hidden
                                  className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm"
                                  style={{ color: "#e88a00" }}
                                >
                                  <Lock size={12} weight="fill" />
                                </span>
                              )}
                              <span className="absolute inset-x-0 bottom-0 p-2.5">
                                <span className="block font-serif text-[12px] font-semibold leading-tight text-white line-clamp-2">
                                  {b.name}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11.5px] font-semibold" style={{ color: "#a8365f" }}>
                        Bientôt de nouveaux événements…
                      </p>
                    )}
                  </div>

                  <div
                    id="accueil-seconde-main"
                    className="p-3 rounded-2xl shadow-card"
                    style={{ background: "linear-gradient(135deg, #c9ede6 0%, #f1faf8 100%)" }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden
                          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-full text-white shadow-sm"
                          style={{ background: "#2E9E8F" }}
                        >
                          <Package size={22} weight="fill" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold leading-tight" style={{ color: "#155e55" }}>Seconde main</h3>
                          <p className="text-[11.5px] leading-snug" style={{ color: "#227a6f" }}>Bonnes affaires entre membres</p>
                        </div>
                      </div>
                      <Link
                        href={canSeeEventDetail ? "/seconde-main" : "/mon-compte/upgrade"}
                        className="shrink-0 text-[13px] font-semibold no-underline"
                        style={{ color: "#227a6f" }}
                      >
                        Voir tout ›
                      </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-1 -mx-3 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {previewListingPhotos.length > 0
                        ? previewListingPhotos.slice(0, 8).map((listing) => (
                            <Link
                              key={listing.id}
                              href={canSeeEventDetail ? `/seconde-main/${listing.id}` : "/mon-compte/upgrade"}
                              className="relative shrink-0 w-[130px] aspect-[4/5] rounded-2xl overflow-hidden shadow-card bg-surface no-underline active:scale-[.98] transition-transform"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={listingPhotoUrl(listing.photos![0].storagePath)}
                                alt=""
                                aria-hidden
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              <div
                                className="absolute inset-0"
                                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                              />
                              {!canSeeEventDetail && (
                                <span
                                  aria-hidden
                                  className="absolute top-1.5 right-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm"
                                  style={{ color: "#e88a00" }}
                                >
                                  <Lock size={12} weight="fill" />
                                </span>
                              )}
                              <span className="absolute inset-x-0 bottom-0 p-2.5">
                                <span className="block font-serif text-[12px] font-semibold leading-tight text-white line-clamp-2">
                                  {listing.title}
                                </span>
                                {listing.price !== undefined && (
                                  <span className="block mt-0.5 text-[11px] font-bold text-white/90">
                                    Rs {listing.price.toLocaleString("fr-FR")}
                                  </span>
                                )}
                              </span>
                            </Link>
                          ))
                        : // Pas encore assez d'annonces avec photo : quelques visuels d'illustration
                          // (objets génériques, non liés à de vraies annonces) pour donner le ton.
                          SECONDE_MAIN_ILLUSTRATIONS.map((src) => (
                            <Link
                              key={src}
                              href={canSeeEventDetail ? "/seconde-main" : "/mon-compte/upgrade"}
                              aria-label="Voir les annonces seconde main"
                              className="relative shrink-0 w-[130px] aspect-[4/5] rounded-2xl overflow-hidden shadow-card bg-surface active:scale-[.98] transition-transform"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                            </Link>
                          ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Accueil → Par catégorie : grille des 8 catégories (un seul niveau
              de profondeur) — clic sur une catégorie → liste plate de ses
              rubriques ; clic sur une rubrique → résultats. */}
          {showHome && homeMode === "categories" && homeCategory === null && (
            <div className="pb-16">
              <div className="flex items-center justify-end mb-2.5">
                <button
                  onClick={() => setBrowseAll(true)}
                  className="text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  Voir tout ({rows.length}) ›
                </button>
              </div>
              {/* Cartes franches (couleur vive, une ligne de description) à la
                  place de la planche illustrée : moins chargé, couleurs
                  pleines. Mêmes clics que les anciennes zones cliquables. */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {EXPLORER_CATEGORIES_HOTSPOTS.map((h) => {
                  const Ico = h.key === "seconde-main" ? Package : iconForKey(h.key);
                  const locked = h.key === "seconde-main" ? true : PREMIUM_CATEGORY_KEYS.has(h.key);
                  return (
                    <Fragment key={h.key}>
                    {h.key === "agenda" && (
                      <p className="sm:col-span-2 mt-3 mb-0.5 flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
                        <Crown size={15} weight="fill" aria-hidden style={{ color: "#e88a00" }} /> Réservé aux membres Premium
                      </p>
                    )}
                    <button
                      onClick={() => {
                        if (h.key === "seconde-main") {
                          window.location.href = canSeeEventDetail ? "/seconde-main" : "/mon-compte/upgrade";
                          return;
                        }
                        if (PREMIUM_CATEGORY_KEYS.has(h.key) && !canSeeEventDetail) {
                          window.location.href = "/mon-compte/upgrade";
                        } else {
                          setHomeCategory(h.key);
                        }
                      }}
                      className={`relative flex items-center gap-3 w-full min-w-0 h-[84px] rounded-2xl px-4 text-left text-white active:scale-[.98] transition-transform ${locked ? "shadow-pop" : "shadow-card"}`}
                      style={
                        locked
                          ? { background: "linear-gradient(135deg, #1d1a14 0%, #3d2c0c 100%)", border: "2px solid #f5c04a" }
                          : { background: `linear-gradient(135deg, color-mix(in srgb, ${h.color} 72%, #fff) 0%, color-mix(in srgb, ${h.color} 86%, #fff) 100%)` }
                      }
                    >
                      <span className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-full ${locked ? "text-[#1d1a14]" : "bg-white/25"}`} style={locked ? { background: "linear-gradient(135deg, #ffe08a, #f5a623)" } : undefined}>
                        {Ico && <Ico size={26} weight="fill" aria-hidden />}
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col leading-tight">
                        <span className="inline-flex items-center gap-1.5 text-[16px] font-extrabold">
                          {h.label}
                          {locked && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-pill text-[9.5px] font-extrabold text-[#1d1a14]" style={{ background: "linear-gradient(135deg, #ffe08a, #f5a623)" }}><Crown size={10} weight="fill" aria-hidden /> VIP</span>}
                        </span>
                        <span className={`text-[12px] font-medium line-clamp-2 ${locked ? "text-[#ffe08a]" : "text-white/90"}`}>{h.sub}</span>
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mascotFor(h.key) ?? "/icon-secondemain.png"}
                        alt=""
                        aria-hidden
                        className="shrink-0 h-[72px] w-[72px] -my-4 -mr-1 object-contain drop-shadow-md"
                      />
                    </button>
                    </Fragment>
                  );
                })}
              </div>

              {topRubriques.length > 0 && (
                <>
                  <h2 className="text-[16px] font-bold text-ink mt-7 mb-2.5">Sous-catégories populaires</h2>
                  <div className="flex flex-col gap-2 sm:max-w-[560px]">
                    {topRubriques.map((t) => (
                      <CategoryRow
                        key={t.key}
                        category={RUBRIQUE_CATEGORY_MAP[t.key]}
                        iconKey={t.key}
                        emoji={t.emoji}
                        label={t.label}
                        count={t.count}
                        locked={PREMIUM_RUBRIQUE_KEYS.has(t.key)}
                        onClick={() => openRubrique(t.key)}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="flex items-center gap-4 mt-7 pt-3 border-t border-border">
                <button
                  onClick={() => setHomeMode("favoris")}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  <Heart size={16} weight="duotone" aria-hidden /> Mes sélections
                </button>
                <button
                  onClick={() => setHomeMode("listes")}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep active:scale-[.98]"
                >
                  <Star size={16} weight="duotone" aria-hidden /> Listes de Koté Moris
                </button>
              </div>
            </div>
          )}

          {/* Accueil → Par catégorie → une catégorie choisie : liste plate de
              ses rubriques (SUBCATEGORIES[cat]), un seul clic vers les résultats. */}
          {showHome && homeMode === "categories" && homeCategory !== null && homeSubRubrique === null && (
            <div className="pb-16">
              <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                <button
                  onClick={() => setHomeCategory(null)}
                  aria-label="Retour"
                  className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                >
                  <ArrowLeft size={17} weight="bold" aria-hidden />
                </button>
                <p className="text-[15px] font-semibold truncate">{CATEGORY_MAP[homeCategory].label}</p>
              </div>
              <div className="h-2.5" />
              {homeCategory === "agenda" ? (
                <div className="sm:max-w-[720px] sm:mx-auto">
                  <div className="grid grid-cols-3 gap-2.5">
                    {AGENDA_GROUPS.map((g) => (
                      <button
                        key={g.key}
                        onClick={() => toggleTheme(g.key)}
                        className="relative text-left rounded-2xl overflow-hidden aspect-[4/5] shadow-card active:scale-[.98] transition-transform"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.photo}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                        />
                        <span className="absolute inset-x-0 bottom-0 p-2.5">
                          <span className="block font-serif text-[12.5px] font-semibold leading-tight text-white">
                            {g.label}
                          </span>
                          <span className="block text-[10.5px] text-white/80 mt-0.5">
                            {themeCountsAll[g.key] || 0} événements
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setActive("agenda");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mt-3 w-full h-[42px] rounded-xl border border-border text-[13.5px] font-semibold text-primary-deep active:scale-[.98] transition-transform"
                  >
                    Voir tout ({counts["agenda"] || 0} événements) ›
                  </button>
                  <Link
                    href={agendaAlertHref}
                    className="mt-2 flex items-center justify-center w-full h-[38px] text-[12.5px] font-semibold text-primary-deep hover:underline"
                  >
                    🔔 Créer une alerte
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-[12px] text-muted mb-2 sm:max-w-[560px] sm:mx-auto">
                    Une case cochée à droite permet de combiner plusieurs rubriques (ex. Restaurants + Cafés, bars &amp; glaciers).
                  </p>
                  <div className="flex flex-col gap-2 pb-20 sm:max-w-[560px] sm:mx-auto">
                    {(SUBCATEGORIES[homeCategory] ?? [])
                      .filter((s) => (themeCountsAll[s.key] || 0) > 0)
                      .map((s) => (
                        <CategoryRow
                          key={s.key}
                          category={homeCategory}
                          iconKey={s.key}
                          emoji={s.emoji}
                          label={s.label}
                          count={themeCountsAll[s.key] || 0}
                          locked={PREMIUM_RUBRIQUE_KEYS.has(s.key)}
                          onClick={() => openRubrique(s.key)}
                          selected={selectedRubriques.has(s.key)}
                          onToggleSelect={() => toggleRubriqueSelection(s.key)}
                        />
                      ))}
                  </div>
                  {selectedRubriques.size > 0 && (
                    <div
                      className="fixed inset-x-0 z-40 flex justify-center px-4"
                      style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 10px)" }}
                    >
                      <button
                        onClick={viewSelectedRubriques}
                        className="w-full sm:max-w-[560px] h-[46px] rounded-xl text-[14px] font-semibold text-white shadow-pop active:scale-[.98] transition-transform"
                        style={{ background: "var(--primary)" }}
                      >
                        Voir les résultats ({selectedRubriques.size} rubrique{selectedRubriques.size > 1 ? "s" : ""}) ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Accueil → Par catégorie → rubrique → sous-rubriques (cf.
              FILTER_GROUPS[].browsable) : dernier niveau avant les résultats,
              restauré après avoir été perdu dans la refonte du 17/08/2026. */}
          {showHome && homeMode === "categories" && homeSubRubrique !== null && (() => {
            const group = browsableGroupFor(homeSubRubrique);
            if (!group) return null;
            const rubriqueLabel = RUBRIQUE_MAP[homeSubRubrique]?.label ?? homeSubRubrique;
            return (
              <div className="pb-16">
                <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                  <button
                    onClick={() => setHomeSubRubrique(null)}
                    aria-label="Retour"
                    className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                  >
                    <ArrowLeft size={17} weight="bold" aria-hidden />
                  </button>
                  <p className="text-[15px] font-semibold truncate">{rubriqueLabel}</p>
                </div>
                <div className="h-2.5" />
                <p className="text-[12px] text-muted mb-2 px-0.5 sm:max-w-[560px] sm:mx-auto">
                  Une case cochée à droite permet de combiner plusieurs options (ex. Mauricienne &amp; créole + Européenne &amp; française).
                </p>
                <div className="flex flex-col gap-2 pb-20 sm:max-w-[560px] sm:mx-auto">
                  {group.options
                    .filter((o) => (subRubriqueCounts[o.key] || 0) > 0)
                    .map((o) => (
                      <CategoryRow
                        key={o.key}
                        category={RUBRIQUE_CATEGORY_MAP[homeSubRubrique]}
                        iconKey={o.key}
                        emoji={o.emoji}
                        label={o.label}
                        count={subRubriqueCounts[o.key] || 0}
                        onClick={() => selectSubRubrique(homeSubRubrique, group, o.key)}
                        selected={selectedSubOptions.has(o.key)}
                        onToggleSelect={() => toggleSubOptionSelection(o.key)}
                      />
                    ))}
                </div>
                {selectedSubOptions.size > 0 && (
                  <div
                    className="fixed inset-x-0 z-40 flex justify-center px-4"
                    style={{ bottom: "calc(64px + env(safe-area-inset-bottom) + 10px)" }}
                  >
                    <button
                      onClick={() => viewSelectedSubOptions(homeSubRubrique, group)}
                      className="w-full sm:max-w-[560px] h-[46px] rounded-xl text-[14px] font-semibold text-white shadow-pop active:scale-[.98] transition-transform"
                      style={{ background: "var(--primary)" }}
                    >
                      Voir les résultats ({selectedSubOptions.size} option{selectedSubOptions.size > 1 ? "s" : ""}) ›
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Accueil → Mes favoris : fiches enregistrées via le cœur (favori + à tester), stockage local. */}
          {showHome && homeMode === "favoris" && (
            <div className="pb-16">
              {account.loggedIn && (
                <div className="max-w-[560px] mx-auto pt-1 pb-4">
                  <MyListsStrip />
                </div>
              )}
              {/* Listes Koté Moris mises en favori + partage des adresses (venus
                  de Mon compte, réorganisation du 2026-09-25). */}
              {(profilFavoriteSelections.length > 0 || favorisMapBusinesses.length > 0) && (
                <div className="max-w-[560px] mx-auto pb-4">
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 flex flex-col gap-4">
                {profilFavoriteSelections.length > 0 && (
                  <div>
                    <p className="m-0 mb-3 text-[13px] font-bold text-ink">Mes listes favorites</p>
                    <div className="flex flex-col gap-2">
                      {profilFavoriteSelections.map((s) => {
                        const SIcon = SELECTION_ICONS[s.icon];
                        return (
                          <button
                            key={s.id}
                            onClick={() => { setBrowseAll(false); setHomeCategory(null); setHomeMode("listes"); setSelectedListId(s.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            className="w-full flex items-center gap-2.5 rounded-xl border border-border p-2.5 text-left active:scale-[.98] transition-transform"
                          >
                            <span
                              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white"
                              style={{ background: "var(--primary, #087e8b)" }}
                            >
                              <SIcon size={16} weight="fill" aria-hidden />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[13px] font-semibold text-ink truncate">{s.title}</span>
                              <span className="block text-[11px] text-muted">{s.businessIds.length} adresses</span>
                            </span>
                            <Heart size={16} weight="fill" aria-hidden style={{ color: COUP_DE_COEUR_COLOR }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className={`-mx-4 -mb-3 ${profilFavoriteSelections.length > 0 ? "border-t border-border pt-1" : "-mt-3"}`}>
                  <button
                    onClick={() => setSharePanelOpen((v) => !v)}
                    disabled={favorisMapBusinesses.length === 0}
                    aria-expanded={sharePanelOpen}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-surface-2 transition-colors disabled:opacity-40 rounded-xl"
                  >
                    <Heart size={18} weight="regular" className="text-muted" aria-hidden />
                    <span className="flex-1 text-[13.5px] text-ink">Partager mes adresses</span>
                    {shareFeedback && <span className="text-[11.5px] font-semibold text-primary-deep">{shareFeedback}</span>}
                  </button>
                  {sharePanelOpen && (
                    <div className="px-4 py-3.5 flex flex-col gap-3" style={{ background: "var(--surface-2)" }}>
                      <p className="m-0 text-[12px] font-semibold text-muted">Quelles adresses partager ?</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(
                          [
                            { status: "favori" as const, label: "Coups de cœur", color: COUP_DE_COEUR_COLOR, count: favoriteBusinesses.length },
                            { status: "a-tester" as const, label: "À tester", color: "#f5a623", count: aTesterBusinesses.length },
                            { status: "teste" as const, label: "Testé", color: "#2e9e5b", count: testeBusinesses.length },
                          ]
                        ).map(({ status, label, color, count }) => {
                          const active = shareStatuses.has(status);
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => toggleShareStatus(status)}
                              disabled={count === 0}
                              aria-pressed={active}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold active:scale-[.97] transition-transform disabled:opacity-40"
                              style={
                                active
                                  ? { background: `color-mix(in srgb, ${color} 15%, var(--surface))`, color, boxShadow: `inset 0 0 0 1.5px ${color}` }
                                  : { background: "var(--surface)", color: "var(--muted)" }
                              }
                            >
                              {label} ({count})
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={shareFavoris}
                        disabled={shareSelectionBusinesses.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold text-white disabled:opacity-40 active:scale-[.98] transition-transform"
                        style={{ background: "var(--primary)" }}
                      >
                        Partager ({shareSelectionBusinesses.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
                </div>
              )}
              {favoriteBusinesses.length === 0 && aTesterBusinesses.length === 0 && testeBusinesses.length === 0 ? (
                <div className="mt-6 max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 flex flex-col items-center gap-3">
                  <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
                    <Heart size={28} weight="duotone" aria-hidden />
                  </span>
                  <p className="font-serif text-lg font-semibold leading-tight">Pas encore de favoris</p>
                  <p className="text-[13px] text-muted leading-snug">
                    Touchez le cœur (coup de cœur), le drapeau (à tester) ou le check (testé) sur une fiche pour l&apos;enregistrer ici.
                  </p>
                </div>
              ) : (
                <div className="max-w-[560px] mx-auto flex flex-col gap-5 pt-1">
                  {/* Incite (sans l'imposer) à se connecter pour ne pas perdre ses
                      favoris en cas de changement de téléphone/navigateur : ils
                      restent utilisables en local sans compte, cf. lib/favorites.ts. */}
                  {!account.loggedIn && (
                    <Link
                      href="/mon-compte"
                      className="flex items-center justify-between gap-3 bg-primary-tint border border-primary/20 rounded-xl p-3.5"
                    >
                      <span className="text-[13px] text-primary-deep font-medium">
                        Connecte-toi pour sauvegarder tes favoris et les retrouver sur un autre appareil.
                      </span>
                      <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">
                        Se connecter
                      </span>
                    </Link>
                  )}
                  {/* Accès direct : passe d'une liste à l'autre sans avoir à scroller. */}
                  <div className="flex items-center gap-2 flex-wrap sticky top-0 z-10 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 bg-bg">
                    <button
                      onClick={() => favorisSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={favoriteBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: `color-mix(in srgb, ${COUP_DE_COEUR_COLOR} 12%, var(--surface))`, color: COUP_DE_COEUR_COLOR }}
                    >
                      <Heart size={14} weight="fill" aria-hidden /> Favoris ({favoriteBusinesses.length})
                    </button>
                    <button
                      onClick={() => aTesterSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={aTesterBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: "color-mix(in srgb, #f5a623 12%, var(--surface))", color: "#f5a623" }}
                    >
                      <Flag size={14} weight="fill" aria-hidden /> À tester ({aTesterBusinesses.length})
                    </button>
                    <button
                      onClick={() => testeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      disabled={testeBusinesses.length === 0 || favorisMapOpen}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold disabled:opacity-40 active:scale-[.97] transition-transform"
                      style={{ background: "color-mix(in srgb, #2e9e5b 12%, var(--surface))", color: "#2e9e5b" }}
                    >
                      <CheckCircle size={14} weight="fill" aria-hidden /> Testé ({testeBusinesses.length})
                    </button>
                    <button
                      onClick={() => setFavorisMapOpen((v) => !v)}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-bold active:scale-[.97] transition-transform border border-border"
                      style={
                        favorisMapOpen
                          ? { background: "var(--primary)", color: "var(--on-primary, #fff)" }
                          : { background: "var(--surface)", color: "var(--ink)" }
                      }
                    >
                      <MapPin size={14} weight={favorisMapOpen ? "fill" : "regular"} aria-hidden />
                      {favorisMapOpen ? "Voir la liste" : "Sur la carte"}
                    </button>
                  </div>
                  {favorisMapOpen ? (
                    <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden isolate h-[65vh]">
                      <Map
                        businesses={favorisMapBusinesses}
                        selectedId={selectedId}
                        onSelect={selectFromCard}
                        onBoundsChange={() => {}}
                        fitKey={`favoris|${favorisMapBusinesses.map((b) => b.id).join(",")}`}
                        hoveredId={hoveredId}
                        onHover={setHoveredId}
                        userPos={userPos}
                      />
                    </div>
                  ) : (
                  <>
                  {favoriteBusinesses.length > 0 && (
                    <div ref={favorisSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] text-muted">
                        {favoriteBusinesses.length} coup{favoriteBusinesses.length > 1 ? "s" : ""} de cœur
                      </p>
                      {favoriteBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  {aTesterBusinesses.length > 0 && (
                    <div ref={aTesterSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] font-bold" style={{ color: "#f5a623" }}>
                        À tester ({aTesterBusinesses.length})
                      </p>
                      {aTesterBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  {testeBusinesses.length > 0 && (
                    <div ref={testeSectionRef} className="flex flex-col gap-3 scroll-mt-[150px]">
                      <p className="m-0 text-[13px] font-bold" style={{ color: "#2e9e5b" }}>
                        Testé ({testeBusinesses.length})
                      </p>
                      {testeBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                        />
                      ))}
                    </div>
                  )}
                  </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Accueil → Listes de Koté Moris : sélections éditoriales par thématique. */}
          {showHome && homeMode === "listes" && selectedListId === null && (
            <div className="pb-16 max-w-[900px] mx-auto">
              <div className="mb-5 text-center">
                <h2 className="font-serif text-xl font-semibold leading-tight">Nos sélections</h2>
                <p className="m-0 mt-1 text-[13px] text-muted leading-snug">
                  Nos coups de cœur pour vivre Maurice autrement.
                </p>
              </div>

              {/* Sélections vedettes (coups de cœur, kids friendly) en tête,
                  comme dans le carrousel de l'accueil. */}
              {featuredSelections.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
                  {featuredSelections.map((f) => (
                    <FeaturedSelectionCard
                      key={f.key}
                      title={f.title}
                      photoUrl={f.photoUrl}
                      badge={f.badge}
                      onClick={f.onClick}
                    />
                  ))}
                </div>
              )}

              {highlightSelections.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
                  {highlightSelections.map((s) => {
                    const SIcon = SELECTION_ICONS[s.icon];
                    const isFav = isFavoriteSelection(s.id);
                    return (
                      <div key={s.id} className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-card">
                        <button
                          onClick={() => setSelectedListId(s.id)}
                          className="absolute inset-0 text-left active:scale-[.98] transition-transform"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={s.photoUrl}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0"
                            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,.72) 100%)" }}
                          />
                          <span
                            className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ background: "var(--primary, #087e8b)" }}
                          >
                            <SIcon size={17} weight="fill" aria-hidden />
                          </span>
                          <span className="absolute inset-x-0 bottom-0 p-3">
                            <span className="block font-serif text-[13.5px] font-semibold leading-tight text-white">
                              {s.title}
                            </span>
                            <span className="block text-[11px] text-white/80 mt-0.5">
                              {s.businessIds.length} adresses
                            </span>
                          </span>
                        </button>
                        <button
                          onClick={() => toggleFavoriteSelection(s.id)}
                          aria-label={isFav ? "Retirer cette liste de mes favoris" : "Ajouter cette liste à mes favoris"}
                          aria-pressed={isFav}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-[.9] transition-transform"
                          style={{ background: "rgba(0,0,0,.35)" }}
                        >
                          <Heart size={17} weight={isFav ? "fill" : "regular"} style={{ color: isFav ? COUP_DE_COEUR_COLOR : undefined }} aria-hidden />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <h3 className="text-[15px] font-bold text-ink mb-2.5">Explorer toutes nos sélections</h3>
              <div className="flex items-center gap-2 mb-3.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setSelectionExploreFilter("tous")}
                  className={`shrink-0 px-3.5 py-1.5 rounded-pill text-[12.5px] font-bold transition-colors ${
                    selectionExploreFilter === "tous" ? "text-on-accent" : "text-ink"
                  }`}
                  style={{ background: selectionExploreFilter === "tous" ? "var(--primary, #087e8b)" : "var(--surface-2, #ececef)" }}
                >
                  Tous
                </button>
                {(Object.keys(SELECTION_GROUP_META) as SelectionGroup[]).map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectionExploreFilter(group)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-pill text-[12.5px] font-bold transition-colors ${
                      selectionExploreFilter === group ? "text-on-accent" : "text-ink"
                    }`}
                    style={{ background: selectionExploreFilter === group ? "var(--primary, #087e8b)" : "var(--surface-2, #ececef)" }}
                  >
                    {SELECTION_GROUP_META[group].label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {exploreSelections.map((s) => {
                  const isFav = isFavoriteSelection(s.id);
                  return (
                    <div key={s.id} className="relative bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => setSelectedListId(s.id)}
                        className="block w-full text-left active:scale-[.98] transition-transform"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.photoUrl}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="w-full h-24 object-cover"
                        />
                        <span className="block p-2.5">
                          <span className="block font-serif text-[12.5px] font-semibold leading-tight line-clamp-2">
                            {s.title}
                          </span>
                          <span className="block text-[11px] text-muted mt-1">{s.businessIds.length} adresses</span>
                        </span>
                      </button>
                      <button
                        onClick={() => toggleFavoriteSelection(s.id)}
                        aria-label={isFav ? "Retirer cette liste de mes favoris" : "Ajouter cette liste à mes favoris"}
                        aria-pressed={isFav}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white active:scale-[.9] transition-transform"
                        style={{ background: "rgba(0,0,0,.35)" }}
                      >
                        <Heart size={15} weight={isFav ? "fill" : "regular"} style={{ color: isFav ? COUP_DE_COEUR_COLOR : undefined }} aria-hidden />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Accueil → Listes de Koté Moris → une sélection ouverte : ses fiches. */}
          {showHome && homeMode === "listes" && selectedList && (
            <div className="pb-16">
              <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 py-2 flex items-center gap-2 border-b border-border" style={{ background: "var(--bg)" }}>
                <button
                  onClick={() => setSelectedListId(null)}
                  aria-label="Retour aux sélections"
                  className="shrink-0 w-7 h-7 -ml-1 rounded-full flex items-center justify-center text-ink active:scale-[.95] transition-transform"
                >
                  <ArrowLeft size={17} weight="bold" aria-hidden />
                </button>
                <p className="text-[15px] font-semibold truncate flex-1">
                  <span aria-hidden>{selectedList.emoji}</span> {selectedList.title}
                </p>
                <button
                  onClick={() => toggleFavoriteSelection(selectedList.id)}
                  aria-label={isFavoriteSelection(selectedList.id) ? "Retirer cette liste de mes favoris" : "Ajouter cette liste à mes favoris"}
                  aria-pressed={isFavoriteSelection(selectedList.id)}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center active:scale-[.9] transition-transform"
                >
                  <Heart
                    size={19}
                    weight={isFavoriteSelection(selectedList.id) ? "fill" : "regular"}
                    style={{ color: isFavoriteSelection(selectedList.id) ? COUP_DE_COEUR_COLOR : undefined }}
                    aria-hidden
                  />
                </button>
              </div>
              <div className="max-w-[560px] mx-auto pt-3">
                <p className="m-0 mb-2 text-[13px] text-muted leading-snug">
                  Notre sélection Koté Moris · {selectedListBusinesses.length} adresses — {selectedList.tagline}
                </p>
                <button
                  onClick={toggleNearMe}
                  aria-pressed={nearMe}
                  title="Trier par distance depuis ma position"
                  className={`mb-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold shrink-0 transition-colors ${
                    nearMe ? "bg-primary text-on-primary" : "bg-surface-2 text-ink"
                  }`}
                >
                  <MapPin size={14} weight={nearMe ? "fill" : "regular"} aria-hidden />
                  {geoStatus === "loading" ? "Localisation…" : "Par rapport à ma localisation"}
                </button>
                {geoStatus === "denied" && nearMe === false && (
                  <p className="mb-3 text-[12.5px] text-muted">
                    📍 Position refusée. Autorisez la localisation dans votre navigateur pour trier par distance.
                  </p>
                )}
                {geoStatus === "unavailable" && (
                  <p className="mb-3 text-[12.5px] text-muted">📍 Géolocalisation indisponible sur cet appareil.</p>
                )}
                {selectedListPlatformBusinesses.length > 0 ? (
                  <>
                    <p className="m-0 mb-2 text-[12px] font-semibold text-muted uppercase tracking-wide">
                      📱 Applis &amp; plateformes de livraison
                    </p>
                    <div className="flex flex-col gap-3 mb-5">
                      {selectedListPlatformBusinesses.map((b) => (
                        <BusinessCard
                          key={b.id}
                          business={b}
                          active={b.id === selectedId}
                          onSelect={selectFromCard}
                          onHover={() => {}}
                          nearbyKm={nearMe ? selectedListDistanceById[b.id] : undefined}
                        />
                      ))}
                    </div>
                    <p className="m-0 mb-2 text-[12px] font-semibold text-muted uppercase tracking-wide">
                      🍽️ Restaurants &amp; adresses
                    </p>
                  </>
                ) : null}
                <div className="flex flex-col gap-3">
                  {selectedListRestBusinesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      active={b.id === selectedId}
                      onSelect={selectFromCard}
                      onHover={() => {}}
                      nearbyKm={nearMe ? selectedListDistanceById[b.id] : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accueil → Ajouter une adresse : formulaire de suggestion, réservé
              aux membres de la communauté/admin (accessible depuis Mon compte). */}
          {showHome && homeMode === "ajouter" && (account.role === "community" || account.role === "admin") && (
            <div className="pb-16">
              <AddAddressForm />
            </div>
          )}

          {/* Accueil → Mon compte : statut Supabase (abonnement/rôle/annonces) en
              haut, puis le tableau de bord local (favoris/sélections/suggestions). */}
          {showHome && homeMode === "profil" && (
            <div className="pb-16 pt-4 max-w-[560px] mx-auto flex flex-col gap-4">
              <div className="text-center bg-surface border border-border rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3">
                <div className="relative w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarPreview ?? account.avatarUrl ?? defaultAvatar}
                    alt="Photo de profil"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  {account.loggedIn && (
                    <>
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadAvatar(file);
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileRef.current?.click()}
                        disabled={avatarUploading}
                        aria-label="Modifier la photo de profil"
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm active:scale-[.95] transition-transform disabled:opacity-60"
                      >
                        <Camera size={14} weight="bold" aria-hidden />
                      </button>
                    </>
                  )}
                </div>
                {account.loading ? (
                  <p className="text-[13px] text-muted leading-snug">Chargement…</p>
                ) : account.loggedIn ? (
                  <>
                    <p className="font-serif text-lg font-semibold leading-tight break-all">{account.email}</p>
                    <span
                      className="text-[13px] font-bold px-4 py-1.5 rounded-pill"
                      style={
                        account.role === "admin"
                          ? { background: "#111", color: "#fff" }
                          : account.role === "community"
                          ? { background: "color-mix(in srgb, #2e9e5b 15%, var(--surface))", color: "#1f7a45" }
                          : account.isPremium
                          ? { background: "color-mix(in srgb, #f5a623 18%, var(--surface))", color: "#8a5a00" }
                          : { background: "var(--surface-2)", color: "var(--muted)" }
                      }
                    >
                      {account.role === "admin"
                        ? "👑 Admin"
                        : account.role === "community"
                        ? "🤝 Contributeur KM"
                        : account.isPremium
                        ? "✨ Premium"
                        : "🔎 Découverte"}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="text-[12.5px] font-semibold text-muted underline underline-offset-2 disabled:opacity-50"
                    >
                      {loggingOut ? "Déconnexion…" : "Se déconnecter"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-serif text-lg font-semibold leading-tight">👤 Connecte-toi pour profiter pleinement de Koté Moris !</p>
                    <p className="text-[13px] text-muted leading-snug">
                      Ta connexion est nécessaire pour enregistrer et retrouver tes favoris. ❤️
                    </p>
                    <Link
                      href="/mon-compte"
                      className="h-[40px] px-5 rounded-xl bg-primary text-on-primary text-[13.5px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
                    >
                      Se connecter
                    </Link>
                  </>
                )}
              </div>

              {/* Légende des 2 statuts Koté Moris et de ce qu'ils débloquent. */}
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4 flex flex-col gap-4">
                <p className="m-0 font-serif text-[15px] font-semibold leading-tight">🌴 Ton Koté Moris, ton expérience !</p>
                {[
                  {
                    avatar: "/avatar-decouverte.png",
                    title: "🔎 DÉCOUVERTE",
                    price: "0 Rs — Gratuit",
                    intro: "Explore tout l'annuaire en illimité :",
                    features: [
                      "🔍 Recherche libre & par catégorie",
                      "❤️ Favoris",
                      "🌴 Sélections Koté Moris",
                      "📤 Partage des bonnes adresses",
                    ],
                  },
                  {
                    avatar: "/avatar-premium.png",
                    title: "⭐ PREMIUM",
                    price: PREMIUM_PRICE_LABEL,
                    intro: "Tout le mode Découverte +",
                    features: [
                      "🎉 Événements",
                      "♻️ Seconde main",
                      "🔔 Alertes personnalisées",
                      "⚡ Accès prioritaire aux nouvelles adresses",
                    ],
                  },
                ].map((tier) => {
                  const showCta = tier.title === "⭐ PREMIUM" && account.loggedIn && !account.isPremium;
                  return (
                    <div
                      key={tier.title}
                      className="flex items-center gap-3.5 rounded-2xl"
                      style={showCta ? { background: "linear-gradient(135deg, #f5a623, #e88a00)", padding: "12px" } : undefined}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tier.avatar}
                        alt={tier.title}
                        className="w-16 h-16 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className={`m-0 text-[13px] font-bold ${showCta ? "text-white" : "text-ink"}`}>{tier.title}</p>
                          <span className={`text-[12px] font-semibold ${showCta ? "text-white/90" : "text-muted"}`}>{tier.price}</span>
                        </div>
                        <p className={`m-0 mt-0.5 text-[12px] leading-snug ${showCta ? "text-white/90" : "text-muted"}`}>{tier.intro}</p>
                        <ul className="m-0 mt-1 pl-0 list-none flex flex-col gap-0.5">
                          {tier.features.map((f) => (
                            <li key={f} className={`text-[12px] leading-snug ${showCta ? "text-white/90" : "text-muted"}`}>{f}</li>
                          ))}
                        </ul>
                        {showCta && (
                          <Link
                            href="/mon-compte/upgrade"
                            className="mt-2 inline-flex h-[34px] px-5 rounded-full bg-white text-[12.5px] font-bold items-center justify-center active:scale-[.98] transition-transform"
                            style={{ color: "#8a5a00" }}
                          >
                            S&apos;abonner
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {account.loggedIn && (
                <Link
                  href="/mon-compte"
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-2xl shadow-sm p-3.5"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Storefront size={18} className="text-muted shrink-0" aria-hidden />
                    <span className="text-[13px] text-ink truncate">
                      {account.listings.filter((l) => l.status === "pending" || l.status === "approved").length}/
                      {MAX_ACTIVE_LISTINGS} annonces actives
                    </span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">Gérer</span>
                </Link>
              )}

              {account.loggedIn && (
                <Link
                  href="/mon-compte/alertes"
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-2xl shadow-sm p-3.5"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <BellRinging size={18} className="text-muted shrink-0" aria-hidden />
                    <span className="text-[13px] text-ink truncate">Alertes email (annonces & événements)</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">Gérer</span>
                </Link>
              )}

              {account.loggedIn && account.role === "admin" && (
                <Link
                  href="/admin/seconde-main"
                  className="flex items-center justify-between gap-3 bg-surface border border-border rounded-2xl shadow-sm p-3.5"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck size={18} className="text-muted shrink-0" aria-hidden />
                    <span className="text-[13px] text-ink truncate">Modération des annonces</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">Ouvrir</span>
                </Link>
              )}

              {/* Mes préférences : rubriques cochées explicitement pour personnaliser
                  l'ordre de l'accueil (homeTopCategories), + "j'ai des enfants" qui
                  booste "famille-travail" sans avoir à la cocher soi-même. */}
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-4">
                <p className="m-0 mb-1 text-[13px] font-bold text-ink">Mes préférences</p>
                <p className="m-0 mb-3 text-[12px] text-muted leading-snug">
                  Coche ce qui t&apos;intéresse pour personnaliser ton accueil.
                </p>
                <label className="flex items-center gap-2.5 mb-3 pb-3 border-b border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.hasKids}
                    onChange={(e) => setHasKids(e.target.checked)}
                    className="w-4 h-4 accent-[var(--primary)] shrink-0"
                  />
                  <span
                    className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2"
                    style={{ borderColor: preferences.hasKids ? "var(--primary)" : "transparent" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/pref-icons/kids.png" alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="text-[13px] text-ink">J&apos;ai des enfants</span>
                </label>
                <div className="flex flex-wrap gap-x-2 gap-y-3">
                  {CATEGORIES.map((c) => {
                    const checked = preferences.interests.includes(c.key);
                    const icon = prefIconFor(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleInterest(c.key)}
                        className="flex flex-col items-center gap-1 w-[70px] shrink-0"
                      >
                        <span
                          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-colors"
                          style={{
                            borderColor: checked ? c.color : "var(--border)",
                            background: checked
                              ? `color-mix(in srgb, ${c.color} 18%, var(--surface))`
                              : "var(--surface-2)",
                          }}
                        >
                          {icon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{c.emoji}</span>
                          )}
                        </span>
                        <span
                          className="text-[11px] font-semibold text-center leading-tight"
                          style={{ color: checked ? c.color : "var(--muted)" }}
                        >
                          {c.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vos catégories préférées : top 3 parmi tout ce qui a un statut. */}
              {profilTopCategories.length > 0 && preferences.interests.length === 0 && (
                <div className="bg-surface border border-border rounded-2xl shadow-sm p-4">
                  <p className="m-0 mb-3 text-[13px] font-bold text-ink">Vos catégories préférées</p>
                  <div className="flex flex-col gap-2.5">
                    {profilTopCategories.map(({ category, count }) => (
                      <div key={category.key} className="flex items-center gap-2.5">
                        <span className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[14px]" style={{ background: `color-mix(in srgb, ${category.color} 15%, var(--surface))` }}>
                          {category.emoji}
                        </span>
                        <span className="flex-1 text-[13px] text-ink truncate">{category.label}</span>
                        <span className="text-[12.5px] font-bold text-muted">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Favoris, listes favorites et partage : déplacés dans l'onglet
                  « Mes adresses » (réorganisation du 2026-09-25) — ici un
                  simple raccourci. */}
              <button
                onClick={() => leaveResults("favoris")}
                className="bg-surface border border-border rounded-2xl shadow-sm p-4 flex items-center gap-3 text-left active:scale-[.99] transition-transform"
              >
                <Heart size={20} weight="fill" aria-hidden style={{ color: COUP_DE_COEUR_COLOR }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-bold text-ink">Mes adresses</span>
                  <span className="block text-[12px] text-muted">
                    {favoriteBusinesses.length} favoris · {aTesterBusinesses.length} à tester · {testeBusinesses.length} testé{testeBusinesses.length > 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-[18px] font-bold text-primary-deep" aria-hidden>›</span>
              </button>
              {/* Listes personnalisées : compte requis. */}
              {account.loggedIn && <MyListsLink />}

              {/* Actions rapides. */}
              <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
                {(account.role === "community" || account.role === "admin") && (
                  <button
                    onClick={() => { setBrowseAll(false); setHomeCategory(null); setHomeMode("ajouter"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors border-b border-border"
                  >
                    <Plus size={18} weight="regular" className="text-muted" aria-hidden />
                    <span className="flex-1 text-[13.5px] text-ink">Suggérer une adresse</span>
                  </button>
                )}
                {account.loggedIn ? (
                  <p className="px-4 py-3.5 text-[12px] text-muted leading-snug border-b border-border">
                    Vos favoris sont sauvegardés automatiquement sur votre compte.
                  </p>
                ) : (
                  <>
                    <button
                      onClick={exportFavoris}
                      disabled={favorisMapBusinesses.length === 0}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors disabled:opacity-40 border-b border-border"
                    >
                      <DownloadSimple size={18} weight="regular" className="text-muted" aria-hidden />
                      <span className="flex-1 text-[13.5px] text-ink">Sauvegarder mes favoris</span>
                    </button>
                    <button
                      onClick={() => importFileRef.current?.click()}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors border-b border-border"
                    >
                      <UploadSimple size={18} weight="regular" className="text-muted" aria-hidden />
                      <span className="flex-1 text-[13.5px] text-ink">Restaurer une sauvegarde</span>
                      <input
                        ref={importFileRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) importFavoris(file);
                          e.target.value = "";
                        }}
                      />
                    </button>
                  </>
                )}
                <ContactUsButton />
              </div>
              {backupFeedback && (
                <p className="text-center text-[12.5px] font-semibold text-primary-deep -mt-1.5">{backupFeedback}</p>
              )}
            </div>
          )}

          {/* Recherche ouverte mais rien de tapé : on n'affiche pas encore
              la liste (voir `mobileTiles`), juste une invite légère. */}
          {searchOpen && !showHome && mobileTiles && (
            <div className="text-center py-[70px] px-5 text-muted">
              <div className="text-4xl mb-2.5">🔍</div>
              Tapez pour rechercher une activité, un lieu, un nom…
            </div>
          )}

          {/* Barre de résultats, liste et carte : ne se montent que lorsque
              `mobileTiles` est faux, c'est-à-dire qu'il y a vraiment quelque
              chose à afficher (recherche tapée, filtre, ou « Voir tout »).
              Avant, ce bloc restait monté en permanence (juste masqué en
              CSS), ce qui générait d'un coup les ~2000 fiches (+ carte) dès
              qu'on quittait l'accueil — d'où le ralentissement au premier tap
              sur la recherche. */}
          {!mobileTiles && (
            <>
          {/* Barre de résultats : « Autour de moi » / zone + bascule liste/carte,
              tenue sur une seule ligne (bande réduite) pour laisser plus de
              place aux fiches en dessous. La flèche « retour » vit désormais
              dans le header compact au-dessus (cf. mobileTiles ? ... : ...),
              ce qui rend de la largeur à cette rangée. */}
          <div className="sticky top-0 z-20 -mx-4 lg:-mx-5 px-4 lg:px-5 flex items-center gap-2 py-1.5 border-b border-border mb-3" style={{ background: "var(--bg)" }}>
            <button
              onClick={() => {
                if (resultsView === "carte") {
                  setResultsView("liste");
                } else {
                  setResultsView("carte");
                  setMapEverOpened(true);
                  requestUserPosSilently();
                }
              }}
              aria-pressed={resultsView === "carte"}
              title={resultsView === "carte" ? "Voir en liste" : "Voir la carte"}
              className={`lg:hidden shrink-0 ml-auto order-last inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                resultsView === "carte" ? "bg-primary text-on-primary" : "bg-surface-2 text-ink"
              }`}
            >
              <MapPin size={14} weight={resultsView === "carte" ? "fill" : "regular"} aria-hidden />
              {resultsView === "carte" ? "Voir en liste" : "Voir la carte"}
            </button>
            {zoneControls}
          </div>

          {/* Ligne dédiée pour « Ouvert maintenant » : évite qu'il soit
              tronqué dans la rangée défilante ci-dessus sur petit écran. */}
          <div className="-mx-4 lg:-mx-5 px-4 lg:px-5 pb-2">{openNowControl}</div>

          {/* Catégories — accessibles en mobile dans les résultats/la carte,
              uniquement en recherche/« voir tout » (browseAll) : quand on
              arrive par Explorer par catégorie, on est déjà dans une seule
              catégorie donc la rangée n'a plus de sens (sidebar desktop only). */}
          {browseAll && (
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3 -mt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => selectCategoryChip("all")}
                className={`shrink-0 px-3 py-1.5 rounded-pill text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                  active === "all" ? "bg-ink text-white" : "bg-[#EFE9DD] text-ink/70"
                }`}
              >
                Toutes
              </button>
              {CATEGORIES.filter((c) => (counts[c.key] || 0) > 0).map((c) => {
                const CIcon = iconForKey(c.key);
                const isActive = active === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => selectCategoryChip(c.key)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-[12.5px] font-semibold whitespace-nowrap transition-colors"
                    style={
                      isActive
                        ? { background: c.color, color: "#fff" }
                        : { background: `${c.color}22`, color: `var(--cat-${c.key}-text)` }
                    }
                  >
                    {CIcon ? <CIcon size={13} weight={isActive ? "fill" : "regular"} aria-hidden /> : <span aria-hidden>{c.emoji}</span>}
                    {c.label}
                  </button>
                );
              })}
              {active !== "all" && (SUBCATEGORIES[active as keyof typeof SUBCATEGORIES]?.length ?? 0) > 1 && (
                <FilterDropdown
                  label="Sous-catégorie"
                  options={(SUBCATEGORIES[active as keyof typeof SUBCATEGORIES] ?? []).map((s) => ({
                    key: s.key,
                    label: s.label,
                    count: themeCountsAll[s.key] || 0,
                    icon: <span aria-hidden>{s.emoji}</span>,
                  }))}
                  selected={activeThemes}
                  onToggle={toggleActiveTheme}
                  onClear={() => setActiveThemes(new Set())}
                />
              )}
            </div>
          )}

          {geoStatus === "denied" && nearMe === false && (
            <p className="mb-3 text-[12.5px] text-muted">
              📍 Position refusée. Autorisez la localisation dans votre navigateur pour trier par distance.
            </p>
          )}
          {geoStatus === "unavailable" && (
            <p className="mb-3 text-[12.5px] text-muted">📍 Géolocalisation indisponible sur cet appareil.</p>
          )}

          {activeCategoryLocked ? (
            <div className="max-w-[300px] w-full mx-auto mt-8 text-center bg-surface/95 backdrop-blur-sm rounded-2xl shadow-lg p-5 flex flex-col items-center gap-2" style={{ border: "2px solid var(--accent)" }}>
              <span className="text-3xl" aria-hidden>🔒</span>
              <p className="font-serif text-lg font-semibold leading-tight">Réservé aux membres Premium</p>
              <p className="text-[13px] text-muted leading-snug">
                Débloquez « {breadcrumb.label} » et tout le contenu Premium de Koté Moris.
              </p>
              <button
                disabled
                className="mt-1 px-4 py-2 rounded-full font-bold text-on-accent cursor-not-allowed opacity-90"
                style={{ background: "var(--accent)" }}
              >
                ✨ Devenir Premium
              </button>
              <span className="text-[11px] text-muted/80">Bientôt disponible</span>
            </div>
          ) : (
            <>
              {imageBadgesRow}
              {restoFilterBar}

              <div className="flex flex-col lg:flex-row lg:gap-4 lg:h-[calc(100vh-190px)]">
                {/* Liste — en vue carte mobile, affichée sous la carte avec les
                    seules adresses de la zone visible. */}
                <div
                  className={`lg:w-[56%] lg:overflow-y-auto lg:pr-1 ${
                    mobileMapView ? "order-2 mt-3" : ""
                  }`}
                >
              {mobileMapView && visibleRows.length > 0 && (
                <p className="mb-2 text-[12.5px] text-muted">
                  {visibleRows.length} adresse{visibleRows.length > 1 ? "s" : ""} dans la zone visible
                </p>
              )}
              {visibleRows.length === 0 ? (
                <div className="text-center py-[70px] px-5 text-muted">
                  <div className="text-4xl mb-2.5">🔍</div>
                  {mobileMapView
                    ? "Aucune adresse dans cette zone. Dézoomez ou déplacez la carte."
                    : filterByMap
                    ? "Aucune adresse dans cette zone. Dézoomez, déplacez la carte, ou décochez « N'afficher que la zone de la carte »."
                    : "Aucun résultat. Essayez un autre mot-clé ou une autre catégorie."}
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-16">
                  {visibleRows.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      active={b.id === selectedId || b.id === hoveredId}
                      onSelect={selectFromCard}
                      onHover={setHoveredId}
                      nearbyKm={nearMe ? distanceById[b.id] : undefined}
                      hiddenKeys={ficheHiddenKeys}
                      cardRef={(el) => {
                        cardRefs.current[b.id] = el;
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Carte */}
            <div
              className={`lg:w-[44%] lg:h-full ${
                resultsView === "liste" ? "hidden lg:block" : "order-1"
              }`}
            >
              <div className="rounded-card border border-border bg-surface shadow-card overflow-hidden isolate h-[55vh] lg:h-full flex flex-col">
                {/* Bandeau d'info + case « Zone visible » : desktop seulement. Sur
                    mobile il mangeait la carte, et la liste sous la carte suit
                    déjà la zone visible. */}
                <div className="hidden lg:flex items-center justify-between gap-3 flex-wrap px-4 py-2.5 border-b border-border">
                  <span className="text-[12.5px] text-muted">
                    Carte des activités — positions GPS
                    {mapMarkerRows.length < rows.length && ` (${mapMarkerRows.length} les + proches sur ${rows.length})`}
                  </span>
                  <label className="inline-flex items-center gap-2 text-[12.5px] font-medium text-ink cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterByMap}
                      onChange={(e) => setFilterByMap(e.target.checked)}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                    Zone visible uniquement
                  </label>
                </div>
                <div className="flex-1 min-h-0 bg-surface-2">
                  {(isDesktop || mapEverOpened) && (
                    <Map
                      businesses={mapMarkerRows}
                      selectedId={selectedId}
                      onSelect={selectFromMap}
                      onBoundsChange={onBoundsChange}
                      fitKey={`${active}|${[...activeThemes].join(",")}|${activeZone ?? ""}`}
                      hoveredId={hoveredId}
                      onHover={setHoveredId}
                      userPos={userPos}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
            </>
          )}
        </div>
      </div>

      {/* Vue détail plein écran d'une fiche (clic sur une carte). */}
      {openBusiness && (
        <BusinessDetail
          business={openBusiness}
          onClose={() => setOpenId(null)}
          hiddenKeys={ficheHiddenKeys}
          canSuggest={account.role === "community" || account.role === "admin"}
        />
      )}

      {/* « Mode ajout » d'une liste perso (?addTo=<id>, depuis sa page) :
          bandeau + ajout direct via le bouton liste des fiches. */}
      <AddToListBanner />

      {/* Barre de navigation principale (5 onglets), tout en bas de l'écran. */}
      {tabBar}
    </div>
  );
}
