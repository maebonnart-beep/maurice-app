"use client";

import { useEffect, useState } from "react";
import type { Listing } from "@/lib/marketplace/types";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { listingPhotoUrl } from "@/lib/marketplace/constants";
import { mapListingRow } from "@/lib/marketplace/mapRow";

export function AdminSecondeMainClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    return fetch("/api/admin/listings")
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
    fetch("/api/admin/listings")
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
  }, []);

  async function decide(id: number, decision: "approved" | "rejected") {
    setBusyId(id);
    const rejectionReason =
      decision === "rejected" ? window.prompt("Motif du refus (optionnel)") ?? undefined : undefined;
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision, rejectionReason }),
    });
    await load();
    setBusyId(null);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">Modération — Seconde main</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Chargement…</p>}

      {!loading && listings.length === 0 && !error && (
        <p className="text-sm text-gray-500">Aucune annonce en attente.</p>
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
              <p className="font-semibold">{listing.title}</p>
              <p className="text-sm text-gray-500">
                {LISTING_CATEGORIES.find((c) => c.key === listing.category)?.label}
                {listing.price !== undefined && ` · Rs ${listing.price.toLocaleString("fr-FR")}`}
                {listing.zone && ` · ${listing.zone}`}
              </p>
              <p className="text-sm text-gray-500">WhatsApp : {listing.whatsapp}</p>
              {listing.description && <p className="text-sm mt-1">{listing.description}</p>}
              <div className="flex gap-2 mt-2">
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
