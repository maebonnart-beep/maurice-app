"use client";

import { useState, type ReactNode } from "react";
import type { Business } from "@/lib/types";
import { CATEGORIES } from "@/data/categories";
import {
  Tag,
  CategoryBadge,
  SpecialBadge,
  ActionButton,
  FilterChip,
  SearchInput,
  CategoryTile,
  BusinessCard,
} from "@/components/ui";

// Jetons de couleur documentés (valeurs = mode clair ; le mode sombre bascule via CSS).
const COLOR_TOKENS: { name: string; var: string; hex: string; onDark?: boolean }[] = [
  { name: "bg", var: "--bg", hex: "#eef4f3" },
  { name: "surface", var: "--surface", hex: "#ffffff" },
  { name: "surface-2", var: "--surface-2", hex: "#f4f8f7" },
  { name: "ink", var: "--ink", hex: "#0d2b2a", onDark: true },
  { name: "muted", var: "--muted", hex: "#5c726f", onDark: true },
  { name: "border", var: "--border", hex: "#d9e6e3" },
  { name: "primary", var: "--primary", hex: "#0e8b84", onDark: true },
  { name: "primary-deep", var: "--primary-deep", hex: "#0a6d67", onDark: true },
  { name: "primary-tint", var: "--primary-tint", hex: "#e2f1ef" },
  { name: "accent", var: "--accent", hex: "#ef6a4c", onDark: true },
];

// Fiches d'exemple couvrant les variantes de BusinessCard.
const SAMPLES: Business[] = [
  {
    id: "demo-1",
    name: "La Table du Chef",
    category: "food",
    address: "Royal Road, Grand Baie",
    phone: "+230 263 0000",
    website: "https://example.com",
    email: "hello@example.com",
    googleMapsUrl: "https://maps.google.com",
    themes: ["restaurants"],
    priceRange: "se-faire-plaisir",
    hours: "Lun-Sam 11h30-22h",
    badge: "coup-de-coeur",
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
    category: "activites",
    address: "Rivière Noire",
    phone: "+230 5700 0000",
    website: "https://example.com",
    themes: ["sports-nautiques"],
    isAgency: true,
    badge: "partenaire",
    duration: "3h",
  },
  {
    id: "demo-3",
    name: "Sentier du Morne",
    category: "activites",
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

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10">
      <header className="mb-10">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight mb-1">
          <span className="w-3 h-3 rounded-full bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]" />
          Maurice<sup className="text-accent">+</sup>
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

      <Section title="Typographie" hint="Police Plus Jakarta Sans (next/font). Échelle sémantique.">
        <div className="rounded-card border border-border bg-surface p-5 flex flex-col gap-2">
          <p className="text-3xl font-extrabold tracking-tight">Titre — Plus Jakarta Sans</p>
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
            { cls: "rounded-btn", label: "rounded-btn · 10px" },
            { cls: "rounded-card", label: "rounded-card · 16px" },
            { cls: "rounded-tile", label: "rounded-tile · 16px" },
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
          <SpecialBadge variant="coup-de-coeur" />
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
    </div>
  );
}
