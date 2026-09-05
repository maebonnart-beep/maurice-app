"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Listing, ListingStatus } from "@/lib/marketplace/types";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { MAX_ACTIVE_LISTINGS, PREMIUM_PRICE_LABEL } from "@/lib/marketplace/constants";
import { mapListingRow } from "@/lib/marketplace/mapRow";

const STATUS_LABELS: Record<ListingStatus, string> = {
  pending: "En attente de validation",
  approved: "En ligne",
  rejected: "Refusée",
  expired: "Expirée",
  sold: "Vendue",
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  expired: "bg-surface-2 text-muted",
  sold: "bg-surface-2 text-muted",
};

function fetchListings(): Promise<Listing[]> {
  return fetch("/api/listings")
    .then((res) => (res.ok ? res.json() : []))
    .then((rows: Record<string, unknown>[]) => rows.map(mapListingRow));
}

export function AccountClient({ email, isPremium }: { email: string; isPremium: boolean }) {
  const [listings, setListings] = useState<Listing[] | null>(null);
  // Calculées une fois les données chargées (pas pendant le rendu) pour ne
  // pas appeler Date.now() de façon impure dans le corps du composant.
  const [expiringSoon, setExpiringSoon] = useState<Listing[]>([]);
  const [expired, setExpired] = useState<Listing[]>([]);
  const [renewing, setRenewing] = useState<number | null>(null);

  function applyListings(data: Listing[]) {
    setListings(data);
    const now = Date.now();
    setExpiringSoon(
      data.filter((l) => {
        if (l.status !== "approved" || !l.expiresAt) return false;
        return (new Date(l.expiresAt).getTime() - now) / 86_400_000 <= 3;
      })
    );
    setExpired(data.filter((l) => l.status === "expired"));
  }

  useEffect(() => {
    fetchListings().then(applyListings);
  }, []);

  async function renew(id: number) {
    setRenewing(id);
    await fetch(`/api/listings/${id}/renew`, { method: "PATCH" });
    applyListings(await fetchListings());
    setRenewing(null);
  }

  const activeCount = listings?.filter((l) => l.status === "pending" || l.status === "approved").length ?? 0;

  return (
    <div className="max-w-[640px] mx-auto px-4 pb-24 pt-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="font-serif text-xl font-semibold leading-tight">Mes annonces</p>
        <Link
          href="/mon-compte/nouvelle-annonce"
          className="shrink-0 h-[38px] px-4 rounded-xl bg-primary text-white text-[13.5px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
        >
          Déposer
        </Link>
      </div>
      <p className="text-[12.5px] text-muted mb-4">
        {email} · {activeCount}/{MAX_ACTIVE_LISTINGS} annonces actives
      </p>

      {!isPremium && (
        <Link
          href="/mon-compte/upgrade"
          className="mb-4 flex items-center justify-between gap-3 bg-primary-tint border border-primary/20 rounded-xl p-3.5"
        >
          <span className="text-[13px] text-primary-deep font-medium">
            Passe premium ({PREMIUM_PRICE_LABEL}) pour déposer des annonces.
          </span>
          <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">S&apos;abonner</span>
        </Link>
      )}

      {expiringSoon.length > 0 || expired.length > 0 ? (
        <div className="mb-4 flex flex-col gap-2">
          {expiringSoon.map((l) => (
            <div key={l.id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <p className="m-0 text-[12.5px] text-amber-900">
                « {l.title} » arrive bientôt à expiration.
              </p>
              <button
                onClick={() => renew(l.id)}
                disabled={renewing === l.id}
                className="shrink-0 text-[12px] font-semibold text-primary-deep underline"
              >
                Renouveler
              </button>
            </div>
          ))}
          {expired.map((l) => (
            <div key={l.id} className="bg-surface-2 border border-border rounded-xl p-3 flex items-center justify-between gap-3">
              <p className="m-0 text-[12.5px] text-muted">« {l.title} » a expiré.</p>
              <button
                onClick={() => renew(l.id)}
                disabled={renewing === l.id}
                className="shrink-0 text-[12px] font-semibold text-primary-deep underline"
              >
                Renouveler
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {listings === null ? (
        <p className="text-center text-muted text-[13px] mt-10">Chargement…</p>
      ) : listings.length === 0 ? (
        <p className="text-center text-muted text-[13px] mt-10">Aucune annonce pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/mon-compte/annonces/${listing.id}`}
              className="block bg-surface border border-border rounded-card p-3 active:scale-[.99] transition-transform"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 font-serif text-[15px] font-semibold truncate">{listing.title}</h3>
                <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-pill ${STATUS_COLORS[listing.status]}`}>
                  {STATUS_LABELS[listing.status]}
                </span>
              </div>
              <p className="m-0 mt-1 text-[12px] text-muted">
                {LISTING_CATEGORIES.find((c) => c.key === listing.category)?.label}
                {listing.price !== undefined && ` · Rs ${listing.price.toLocaleString("fr-FR")}`}
              </p>
              {listing.status === "rejected" && listing.rejectionReason && (
                <p className="m-0 mt-1 text-[12px] text-red-700">Motif : {listing.rejectionReason}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
