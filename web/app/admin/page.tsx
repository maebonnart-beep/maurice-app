"use client";

import { useEffect, useMemo, useState } from "react";
import type { Business } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";

const COMMON_FIELDS: { key: keyof Business; label: string }[] = [
  { key: "name", label: "Nom" },
  { key: "description", label: "Description" },
  { key: "entryPrice", label: "Prix / tarif" },
  { key: "hours", label: "Horaires" },
  { key: "phone", label: "Téléphone" },
  { key: "website", label: "Site web" },
  { key: "address", label: "Adresse" },
  { key: "animalsVisible", label: "Animaux visibles" },
  { key: "promoText", label: "Texte promo" },
];

const BADGE_OPTIONS = [
  { value: "", label: "Aucun" },
  { value: "selection", label: "Sélection" },
  { value: "partenaire", label: "Partenaire" },
];

const ZONE_OPTIONS = ["", "nord", "sud", "est", "ouest", "centre"];

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [advancedJson, setAdvancedJson] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/businesses")
      .then((r) => r.json())
      .then((data) => setBusinesses(data))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return businesses
      .filter((b) => b.name.toLowerCase().includes(q) || b.id.includes(q))
      .slice(0, 30);
  }, [query, businesses]);

  const selected = businesses.find((b) => b.id === selectedId) || null;

  function selectBusiness(b: Business) {
    setSelectedId(b.id);
    setStatus(null);
    const commonKeys = new Set(["badge", "zone", ...COMMON_FIELDS.map((f) => f.key)]);
    const nextForm: Record<string, string> = { badge: b.badge || "", zone: b.zone || "" };
    for (const f of COMMON_FIELDS) {
      nextForm[f.key] = (b[f.key] as string) || "";
    }
    setForm(nextForm);

    const rest: Record<string, unknown> = {};
    for (const key of Object.keys(b)) {
      if (!commonKeys.has(key) && key !== "id") {
        rest[key] = (b as Record<string, unknown>)[key];
      }
    }
    setAdvancedJson(JSON.stringify(rest, null, 2));
    setShowAdvanced(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setStatus(null);

    let advancedPatch: Record<string, unknown> = {};
    if (showAdvanced) {
      try {
        advancedPatch = JSON.parse(advancedJson || "{}");
      } catch {
        setStatus("Erreur : le JSON des champs avancés n'est pas valide.");
        setSaving(false);
        return;
      }
    }

    const patch: Record<string, unknown> = { ...advancedPatch };
    for (const f of COMMON_FIELDS) {
      patch[f.key] = form[f.key] ?? "";
    }
    patch.badge = form.badge ?? "";
    patch.zone = form.zone ?? "";

    try {
      const res = await fetch("/api/admin/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(`Erreur : ${data.error || res.statusText}`);
      } else {
        setStatus("Enregistré ✓ — pense à demander le commit + déploiement ensuite.");
        setBusinesses((prev) => prev.map((b) => (b.id === data.business.id ? data.business : b)));
      }
    } catch {
      setStatus("Erreur réseau lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg text-ink p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Admin — Fiches Koté Moris</h1>
      <p className="text-sm text-muted mb-4">
        Outil local uniquement (npm run dev). Les modifications sont écrites directement dans{" "}
        <code>data/businesses.json</code>. Le site en production n&apos;est pas affecté tant que
        les changements ne sont pas commités et redéployés.
      </p>

      <input
        type="text"
        placeholder="Rechercher une fiche par nom..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-[var(--radius)] border border-border bg-surface px-4 py-2 mb-3"
      />

      {loading && <p className="text-sm text-muted">Chargement…</p>}

      {!loading && results.length > 0 && !selected && (
        <ul className="divide-y divide-border rounded-[var(--radius)] border border-border bg-surface overflow-hidden">
          {results.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => selectBusiness(b)}
                className="w-full text-left px-4 py-2 hover:bg-surface-2 flex justify-between gap-2"
              >
                <span>{b.name}</span>
                <span className="text-xs text-muted">
                  {CATEGORY_MAP[b.category]?.label} · {b.zone || "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-medium">{selected.name}</h2>
            <button
              className="text-sm text-muted underline"
              onClick={() => {
                setSelectedId(null);
                setStatus(null);
              }}
            >
              ← changer de fiche
            </button>
          </div>

          {COMMON_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="block text-muted mb-1">{f.label}</span>
              {f.key === "description" ? (
                <textarea
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
                />
              )}
            </label>
          ))}

          <label className="block text-sm">
            <span className="block text-muted mb-1">Badge</span>
            <select
              value={form.badge || ""}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              {BADGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="block text-muted mb-1">Zone</span>
            <select
              value={form.zone || ""}
              onChange={(e) => setForm({ ...form, zone: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              {ZONE_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z || "—"}
                </option>
              ))}
            </select>
          </label>

          <button
            className="text-sm text-primary underline"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "Masquer" : "Afficher"} les champs avancés (JSON)
          </button>

          {showAdvanced && (
            <textarea
              value={advancedJson}
              onChange={(e) => setAdvancedJson(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs"
              rows={12}
            />
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-[var(--radius)] bg-primary text-white px-4 py-2 disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            {status && <span className="text-sm">{status}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
