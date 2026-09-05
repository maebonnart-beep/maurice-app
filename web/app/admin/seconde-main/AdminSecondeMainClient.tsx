"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Listing, ListingCategoryKey, ListingZone } from "@/lib/marketplace/types";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { listingPhotoUrl } from "@/lib/marketplace/constants";
import { mapListingRow } from "@/lib/marketplace/mapRow";

const ZONES: { key: ListingZone; label: string }[] = [
  { key: "nord", label: "Nord" },
  { key: "sud", label: "Sud" },
  { key: "est", label: "Est" },
  { key: "ouest", label: "Ouest" },
  { key: "centre", label: "Centre" },
];

const inputClass =
  "w-full h-9 px-2.5 rounded-md border border-border bg-surface text-ink text-[13px] focus:outline-none focus:border-primary";

type Tab = "pending" | "all";

type EditState = {
  title: string;
  category: ListingCategoryKey | "";
  price: string;
  zone: ListingZone | "";
  whatsapp: string;
  description: string;
};

function toEditState(listing: Listing): EditState {
  return {
    title: listing.title,
    category: listing.category,
    price: listing.price !== undefined ? String(listing.price) : "",
    zone: listing.zone ?? "",
    whatsapp: listing.whatsapp,
    description: listing.description ?? "",
  };
}

export function AdminSecondeMainClient() {
  const [tab, setTab] = useState<Tab>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);

  function load(currentTab: Tab) {
    setLoading(true);
    return fetch(`/api/admin/listings?status=${currentTab === "all" ? "all" : "pending"}`)
      .then(async (res) => {
        if (res.ok) {
          const rows = (await res.json()) as Record<string, unknown>[];
          setListings(rows.map(mapListingRow));
          setError(null);
        } else {
          const json = await res.json();
          setError(json.error ?? "Erreur de chargement.");
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-tab-change, pas dérivable
    setEditingId(null);
    load(tab);
  }, [tab]);

  async function decide(id: number, decision: "approved" | "rejected") {
    setBusyId(id);
    const rejectionReason =
      decision === "rejected" ? window.prompt("Motif du refus (optionnel)") ?? undefined : undefined;
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, rejectionReason }),
    });
    await load(tab);
    setBusyId(null);
  }

  function startEdit(listing: Listing) {
    setEditingId(listing.id);
    setEdit(toEditState(listing));
  }

  async function saveEdit(id: number) {
    if (!edit || !edit.title.trim() || !edit.category || !edit.whatsapp.trim()) return;
    setBusyId(id);
    await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: edit.title.trim(),
        category: edit.category,
        whatsapp: edit.whatsapp.trim(),
        price: edit.price ? Number(edit.price) : undefined,
        zone: edit.zone || undefined,
        description: edit.description.trim() || undefined,
      }),
    });
    setEditingId(null);
    await load(tab);
    setBusyId(null);
  }

  async function remove(id: number) {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setBusyId(id);
    await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    await load(tab);
    setBusyId(null);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Modération — Seconde main</h1>
        <Link href="/admin/utilisateurs" className="text-sm text-primary underline underline-offset-2">
          Utilisateurs
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("pending")}
          className={`text-sm px-3 py-1 rounded-md ${tab === "pending" ? "bg-primary text-white" : "bg-surface-2"}`}
        >
          En attente
        </button>
        <button
          onClick={() => setTab("all")}
          className={`text-sm px-3 py-1 rounded-md ${tab === "all" ? "bg-primary text-white" : "bg-surface-2"}`}
        >
          Toutes
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Chargement…</p>}

      {!loading && listings.length === 0 && !error && (
        <p className="text-sm text-gray-500">Aucune annonce.</p>
      )}

      <div className="flex flex-col gap-3">
        {listings.map((listing) => (
          <div key={listing.id} className="border rounded-lg p-3 flex gap-3">
            {listing.photos?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listingPhotoUrl(listing.photos[0].storagePath)}
                alt=""
                className="w-20 h-20 object-cover rounded-md shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {editingId === listing.id && edit ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                    placeholder="Titre"
                    className={inputClass}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={edit.category}
                      onChange={(e) => setEdit({ ...edit, category: e.target.value as ListingCategoryKey })}
                      className={inputClass}
                    >
                      {LISTING_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={edit.zone}
                      onChange={(e) => setEdit({ ...edit, zone: e.target.value as ListingZone })}
                      className={inputClass}
                    >
                      <option value="">Zone…</option>
                      {ZONES.map((z) => (
                        <option key={z.key} value={z.key}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={edit.price}
                      onChange={(e) => setEdit({ ...edit, price: e.target.value })}
                      placeholder="Prix (Rs)"
                      className={inputClass}
                    />
                    <input
                      value={edit.whatsapp}
                      onChange={(e) => setEdit({ ...edit, whatsapp: e.target.value })}
                      placeholder="WhatsApp"
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    value={edit.description}
                    onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                    className="w-full px-2.5 py-2 rounded-md border border-border bg-surface text-ink text-[13px] focus:outline-none focus:border-primary resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(listing.id)}
                      disabled={busyId === listing.id}
                      className="text-sm px-3 py-1 rounded-md bg-primary text-white disabled:opacity-40"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm px-3 py-1 rounded-md bg-surface-2"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-semibold">{listing.title}</p>
                  <p className="text-sm text-gray-500">
                    {listing.status !== "pending" && `[${listing.status}] `}
                    {LISTING_CATEGORIES.find((c) => c.key === listing.category)?.label}
                    {listing.price !== undefined && ` · Rs ${listing.price.toLocaleString("fr-FR")}`}
                    {listing.zone && ` · ${listing.zone}`}
                  </p>
                  <p className="text-sm text-gray-500">WhatsApp : {listing.whatsapp}</p>
                  {listing.description && <p className="text-sm mt-1">{listing.description}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {listing.status === "pending" && (
                      <>
                        <button
                          onClick={() => decide(listing.id, "approved")}
                          disabled={busyId === listing.id}
                          className="text-sm px-3 py-1 rounded-md bg-green-600 text-white disabled:opacity-40"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => decide(listing.id, "rejected")}
                          disabled={busyId === listing.id}
                          className="text-sm px-3 py-1 rounded-md bg-red-600 text-white disabled:opacity-40"
                        >
                          Refuser
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => startEdit(listing)}
                      disabled={busyId === listing.id}
                      className="text-sm px-3 py-1 rounded-md bg-surface-2 disabled:opacity-40"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => remove(listing.id)}
                      disabled={busyId === listing.id}
                      className="text-sm px-3 py-1 rounded-md bg-red-600 text-white disabled:opacity-40"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
