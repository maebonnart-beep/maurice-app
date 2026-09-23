"use client";

import { useState, type ReactNode } from "react";
import type { Business } from "@/lib/types";
import type { Listing } from "@/lib/marketplace/types";
import { CATEGORIES } from "@/data/categories";
import {
  Logo,
  Tag,
  CategoryBadge,
  SpecialBadge,
  ActionButton,
  FilterChip,
  SearchInput,
  CategoryTile,
  BusinessCard,
  ListingCard,
} from "@/components/ui";
import { ProviderTypeBadge, PremiumSellerBadge } from "@/components/ui/Badge";
import { BackButton } from "@/components/ui/BackButton";
import { MarketplaceHeader } from "@/components/ui/MarketplaceHeader";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { QuickAlertButton } from "@/components/ui/QuickAlertButton";
import { FilterDropdown, type DropdownOption } from "@/components/ui/FilterDropdown";
import { UniversCard } from "@/components/ui/UniversCard";
import { CategoryRow } from "@/components/ui/CategoryRow";
import { ContactUsButton } from "@/components/ui/ContactUsButton";
import { SuggestCommentButton } from "@/components/ui/SuggestCommentButton";
import { SuggestPhotoButton } from "@/components/ui/SuggestPhotoButton";
import { AddAddressForm } from "@/components/ui/AddAddressForm";

// Jetons de couleur documentés (valeurs = mode clair ; le mode sombre bascule via CSS).
const COLOR_TOKENS: { name: string; var: string; hex: string; onDark?: boolean }[] = [
  { name: "bg", var: "--bg", hex: "#e6f3f1" },
  { name: "surface", var: "--surface", hex: "#ffffff" },
  { name: "surface-2", var: "--surface-2", hex: "#f1f9f8" },
  { name: "ink", var: "--ink", hex: "#123a3f", onDark: true },
  { name: "muted", var: "--muted", hex: "#596b6f", onDark: true },
  { name: "border", var: "--border", hex: "#d6e9e6" },
  { name: "primary", var: "--primary", hex: "#087e8b", onDark: true },
  { name: "primary-deep", var: "--primary-deep", hex: "#066470", onDark: true },
  { name: "primary-tint", var: "--primary-tint", hex: "#d7ede9" },
  { name: "on-primary", var: "--on-primary", hex: "#ffffff" },
  { name: "accent", var: "--accent", hex: "#f4c95d" },
  { name: "on-accent", var: "--on-accent", hex: "#133c40", onDark: true },
];

// Fiches d'exemple couvrant les variantes de BusinessCard.
const SAMPLES: Business[] = [
  {
    id: "demo-1",
    name: "La Table du Chef",
    category: "manger-boire",
    address: "Royal Road, Grand Baie",
    phone: "+230 263 0000",
    website: "https://example.com",
    email: "hello@example.com",
    googleMapsUrl: "https://maps.google.com",
    themes: ["restaurants"],
    priceRange: "se-faire-plaisir",
    hours: "Lun-Sam 11h30-22h",
    badge: "selection",
    photoUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="%230e8b84"/></svg>'
      ),
    description: "Cuisine mauricienne raffinée, vue sur le lagon.",
    promoText: "−10% le midi en semaine sur présentation de l'appli.",
    whatsapp: "+230 5900 0000",
  },
  {
    id: "demo-2",
    name: "Blue Horizon Excursions",
    category: "faire-du-sport",
    address: "Rivière Noire",
    phone: "+230 5700 0000",
    website: "https://example.com",
    themes: ["sports-nautiques"],
    isAgency: true,
    badge: "partenaire",
    duration: "3h",
    eventPeriod: "15–17 août 2026",
  },
  {
    id: "demo-3",
    name: "Sentier du Morne",
    category: "faire-du-sport",
    address: "Le Morne, Sud",
    phone: "",
    website: "",
    themes: ["randonnee-trail"],
    distance: "7,2 km",
    elevationGain: "410 m D+",
    difficultyLevel: "confirme",
    guideRecommended: true,
  },
];

// Annonce d'exemple pour ListingCard (rubrique Seconde main).
const SAMPLE_LISTING: Listing = {
  id: 1,
  userId: "demo",
  title: "Vélo enfant 16 pouces, très bon état",
  description: "Peu servi, freins révisés.",
  price: 1500,
  category: "sport-loisirs",
  whatsapp: "+230 5900 0000",
  zone: "nord",
  status: "approved",
  createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  photos: [],
};

const FILTER_OPTIONS: DropdownOption[] = [
  { key: "creole", label: "Créole", count: 42 },
  { key: "indienne", label: "Indienne", count: 28 },
  { key: "chinoise", label: "Chinoise", count: 11 },
  { key: "fruits-de-mer", label: "Fruits de mer", count: 19 },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold tracking-tight mb-1">{title}</h2>
      {hint && <p className="text-body text-muted mb-4">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="text-caption text-muted font-medium w-40 shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [zone, setZone] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState<Set<string>>(new Set());
  const [rowSelected, setRowSelected] = useState(false);
  const [addAddressOpen, setAddAddressOpen] = useState(false);

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10">
      <header className="mb-10">
        <div className="mb-1 text-ink">
          <Logo />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Design System</h1>
        <p className="text-muted mt-1">
          Tokens et composants de l&apos;appli. Bascule ton OS en mode sombre pour voir le thème.
        </p>
      </header>

      <Section title="Couleurs" hint="Jetons sémantiques — utilisés via les utilitaires bg-*, text-*, border-*.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_TOKENS.map((c) => (
            <div key={c.name} className="rounded-card border border-border overflow-hidden bg-surface">
              <div className="h-16" style={{ background: `var(${c.var})` }} />
              <div className="px-3 py-2">
                <div className="text-body font-semibold">{c.name}</div>
                <div className="text-meta text-muted font-mono">{c.var}</div>
                <div className="text-meta text-muted font-mono">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie" hint="Fraunces (serif) pour les noms de lieux ; Plus Jakarta Sans pour l'UI. Échelle sémantique.">
        <div className="rounded-card border border-border bg-surface p-5 flex flex-col gap-2">
          <p className="font-serif text-3xl font-semibold tracking-tight">Blue Safari Catamaran — Fraunces</p>
          <p className="text-lg font-bold tracking-tight">Interface & texte — Plus Jakarta Sans</p>
          <p className="text-title font-bold">text-title · 16px · titres de fiche</p>
          <p className="text-body">text-body · 13px · texte courant &amp; boutons</p>
          <p className="text-caption text-muted">text-caption · 12.5px · horaires, mentions</p>
          <p className="text-meta text-muted font-semibold uppercase tracking-wide">
            text-meta · 11px · badges, compteurs
          </p>
        </div>
      </Section>

      <Section title="Rayons & élévation" hint="Utilitaires rounded-* et shadow-* du design system.">
        <div className="flex flex-wrap gap-4">
          {[
            { cls: "rounded-btn", label: "rounded-btn · 11px" },
            { cls: "rounded-card", label: "rounded-card · 12px" },
            { cls: "rounded-tile", label: "rounded-tile · 12px" },
            { cls: "rounded-pill", label: "rounded-pill · 999px" },
          ].map((r) => (
            <div key={r.cls} className="flex flex-col items-center gap-1.5">
              <div className={`w-24 h-14 bg-primary-tint border border-border ${r.cls}`} />
              <span className="text-meta text-muted font-mono">{r.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          {[
            { cls: "shadow-sm", label: "shadow-sm" },
            { cls: "shadow-card", label: "shadow-card" },
            { cls: "shadow-pop", label: "shadow-pop" },
          ].map((s) => (
            <div key={s.cls} className="flex flex-col items-center gap-1.5">
              <div className={`w-24 h-14 bg-surface rounded-card ${s.cls}`} />
              <span className="text-meta text-muted font-mono">{s.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Badges">
        <Row label="Catégorie">
          {CATEGORIES.slice(0, 5).map((c) => (
            <CategoryBadge key={c.key} category={c.key} />
          ))}
        </Row>
        <Row label="Mise en avant">
          <SpecialBadge variant="partenaire" />
          <SpecialBadge variant="selection" />
          <SpecialBadge variant="agence" />
        </Row>
      </Section>

      <Section title="Tags">
        <Row label="Thème / prix / info">
          <Tag icon="🍽️">Restaurants</Tag>
          <Tag icon="€€€">Se faire plaisir</Tag>
          <Tag icon="🥡">À emporter</Tag>
          <Tag icon="📏">7,2 km</Tag>
          <Tag icon="⏱️">3h</Tag>
        </Row>
      </Section>

      <Section title="Boutons d'action">
        <Row label="Variantes">
          <ActionButton variant="primary" icon="📞" href="#">
            Appeler
          </ActionButton>
          <ActionButton icon="✉️" href="#">
            Email
          </ActionButton>
          <ActionButton icon="💬" href="#">
            WhatsApp
          </ActionButton>
          <ActionButton icon="🌐" href="#">
            site.com
          </ActionButton>
          <ActionButton disabled icon="📞">
            Sans tél.
          </ActionButton>
        </Row>
      </Section>

      <Section title="Filtres" hint="État actif/inactif ; le champ de recherche.">
        <Row label="Puces">
          <FilterChip active={zone === null} onClick={() => setZone(null)}>
            📍 Toute l&apos;île
          </FilterChip>
          {["Nord", "Est", "Sud", "Ouest", "Centre"].map((z) => (
            <FilterChip key={z} active={zone === z} onClick={() => setZone(z)}>
              {z}
            </FilterChip>
          ))}
        </Row>
        <div className="mt-4 max-w-[420px]">
          <SearchInput value={query} onChange={setQuery} placeholder="Rechercher une activité, un lieu…" />
        </div>
      </Section>

      <Section title="Tuiles de catégorie" hint="Écran d'accueil mobile.">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-[560px]">
          {CATEGORIES.slice(0, 6).map((c, i) => (
            <CategoryTile key={c.key} category={c.key} count={[832, 785, 609, 60, 129, 56][i]} onClick={() => {}} />
          ))}
        </div>
      </Section>

      <Section title="Fiche (BusinessCard)" hint="Composant qui compose badges, tags et boutons.">
        <div className="flex flex-col gap-3 max-w-[560px]">
          {SAMPLES.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              active={selected === b.id}
              onSelect={setSelected}
              onHover={() => {}}
            />
          ))}
        </div>
      </Section>

      <Section title="Badges additionnels" hint="Type de prestataire, vendeur premium (rubrique Seconde main).">
        <Row label="Type de prestataire">
          <ProviderTypeBadge type="particulier" />
          <ProviderTypeBadge type="organisme" />
          <ProviderTypeBadge type="application" />
        </Row>
        <Row label="Vendeur premium">
          <PremiumSellerBadge />
          <PremiumSellerBadge compact />
        </Row>
      </Section>

      <Section title="Favoris" hint="Trois statuts indépendants : coup de cœur, à tester, testé.">
        <Row label="FavoriteButton">
          <FavoriteButton id="demo-fav" />
        </Row>
      </Section>

      <Section title="Filtre déroulant" hint="Menu multi-sélection (FilterDropdown), utilisé dans la barre de filtres.">
        <Row label="FilterDropdown">
          <FilterDropdown
            label="Cuisine"
            options={FILTER_OPTIONS}
            selected={cuisineFilter}
            onToggle={(key) =>
              setCuisineFilter((prev) => {
                const next = new Set(prev);
                next.has(key) ? next.delete(key) : next.add(key);
                return next;
              })
            }
            onClear={() => setCuisineFilter(new Set())}
          />
        </Row>
      </Section>

      <Section title="Alerte rapide" hint="Bouton de création d'alerte en un clic (QuickAlertButton).">
        <Row label="QuickAlertButton">
          <QuickAlertButton type="listing" criteria={{ category: "sport-loisirs" }} />
        </Row>
      </Section>

      <Section title="Carte annonce (ListingCard)" hint="Rubrique Seconde main — mêmes tokens/rythme que BusinessCard.">
        <div className="max-w-[420px]">
          <ListingCard listing={SAMPLE_LISTING} />
        </div>
      </Section>

      <Section title="Carte univers" hint="Accueil « Explorer par catégorie » (UniversCard).">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-[420px]">
          <UniversCard photoKey="manger-boire" label="Manger & boire" subtitle="Restaurants, cafés, bars" onClick={() => {}} />
          <UniversCard photoKey="sortir-decouvrir" label="Sortir" subtitle="Plages, visites, excursions" locked onClick={() => {}} />
        </div>
      </Section>

      <Section title="Ligne de catégorie" hint="Navigation niveau 1 (mascotte) et niveau 2 (rubrique) — CategoryRow.">
        <div className="flex flex-col gap-2.5 max-w-[520px]">
          <CategoryRow category="manger-boire" onClick={() => {}} />
          <CategoryRow
            label="Cuisine créole"
            iconKey="manger-boire"
            count={42}
            onClick={() => {}}
            selected={rowSelected}
            onToggleSelect={() => setRowSelected((s) => !s)}
          />
          <CategoryRow label="Rubrique Premium" iconKey="manger-boire" count={12} locked onClick={() => {}} />
        </div>
      </Section>

      <Section title="En-tête & navigation" hint="Bandeau des pages secondaires (Seconde main, Mon compte) et flèche retour.">
        <div className="max-w-[420px] rounded-card overflow-hidden border border-border">
          <MarketplaceHeader />
        </div>
        <Row label="BackButton">
          <div className="bg-surface-2 rounded-full">
            <BackButton />
          </div>
        </Row>
      </Section>

      <Section title="Formulaires de contribution" hint="Contact, suggestion de commentaire, de photo — même gabarit modale.">
        <Row label="Boutons">
          <ContactUsButton />
          <SuggestCommentButton businessId="demo-1" businessName="La Table du Chef" />
          <SuggestPhotoButton businessId="demo-1" businessName="La Table du Chef" />
        </Row>
      </Section>

      <Section title="Ajouter une adresse" hint="Formulaire complet (AddAddressForm) — ouvert depuis le bandeau du bas.">
        <button
          type="button"
          onClick={() => setAddAddressOpen((o) => !o)}
          className="text-body font-semibold text-primary-deep underline underline-offset-2"
        >
          {addAddressOpen ? "Masquer le formulaire" : "Afficher le formulaire"}
        </button>
        {addAddressOpen && (
          <div className="mt-4 rounded-card border border-border bg-surface p-5">
            <AddAddressForm />
          </div>
        )}
      </Section>
    </div>
  );
}
