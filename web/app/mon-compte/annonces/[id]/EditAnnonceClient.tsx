"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash } from "@phosphor-icons/react";
import { LISTING_CATEGORIES, type Listing, type ListingCategoryKey, type ListingZone } from "@/lib/marketplace/types";
import { mapListingRow } from "@/lib/marketplace/mapRow";

const inputClass =
  "w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary";
const labelClass = "block text-[12px] font-semibold text-muted mb-1.5";

const ZONES: { key: ListingZone; label: string }[] = [
  { key: "nord", label: "Nord" },
  { key: "sud", label: "Sud" },
  { key: "est", label: "Est" },
  { key: "ouest", label: "Ouest" },
  { key: "centre", label: "Centre" },
];

export function EditAnnonceClient({ id }: { id: string }) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategoryKey | "">("");
  const [price, setPrice] = useState("");
  const [zone, setZone] = useState<ListingZone | "">("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`).then(async (res) => {
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const row = await res.json();
      const l = mapListingRow(row);
      setListing(l);
      setTitle(l.title);
      setCategory(l.category);
      setPrice(l.price !== undefined ? String(l.price) : "");
      setZone(l.zone ?? "");
      setWhatsapp(l.whatsapp);
      setDescription(l.description ?? "");
    });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category || !whatsapp.trim()) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        category,
        whatsapp: whatsapp.trim(),
        price: price ? Number(price) : undefined,
        zone: zone || undefined,
        description: description.trim() || undefined,
      }),
    });

    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue.");
      return;
    }
    setSaved(true);
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement cette annonce ?")) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/mon-compte");
    } else {
      const json = await res.json();
      setError(json.error ?? "Suppression impossible.");
      setDeleting(false);
    }
  }

  if (notFound) {
    return (
      <div className="max-w-[480px] mx-auto px-4 pt-10 text-center">
        <p className="text-[13px] text-muted leading-snug">Annonce introuvable.</p>
        <Link href="/mon-compte" className="mt-3 inline-block text-[13px] font-semibold text-primary underline">
          Retour à mes annonces
        </Link>
      </div>
    );
  }

  if (!listing) {
    return <p className="text-center text-muted text-[13px] mt-10">Chargement…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-4">
      <Link href="/mon-compte" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted -mb-1">
        <ArrowLeft size={16} weight="bold" aria-hidden />
        Mes annonces
      </Link>

      <div className="text-center flex flex-col items-center gap-2 mb-1">
        <p className="font-serif text-lg font-semibold leading-tight">Modifier l&apos;annonce</p>
      </div>

      <div>
        <label className={labelClass} htmlFor="ea-titre">
          Titre *
        </label>
        <input
          id="ea-titre"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="ea-categorie">
            Catégorie *
          </label>
          <select
            id="ea-categorie"
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategoryKey)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {LISTING_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ea-zone">
            Zone
          </label>
          <select
            id="ea-zone"
            value={zone}
            onChange={(e) => setZone(e.target.value as ListingZone)}
            className={inputClass}
          >
            <option value="">Choisir…</option>
            {ZONES.map((z) => (
              <option key={z.key} value={z.key}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="ea-prix">
          Prix (Rs)
        </label>
        <input
          id="ea-prix"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ea-whatsapp">
          Numéro WhatsApp de contact *
        </label>
        <input
          id="ea-whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="ea-description">
          Description
        </label>
        <textarea
          id="ea-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {error && <p className="text-[12.5px] text-red-600 text-center">{error}</p>}
      {saved && (
        <p className="text-[12.5px] text-emerald-700 text-center">Annonce mise à jour.</p>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !category || !whatsapp.trim()}
        className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
      >
        {submitting ? "Enregistrement…" : "Enregistrer"}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="w-full h-[46px] rounded-xl font-semibold text-[14px] text-red-700 border border-red-200 bg-red-50 flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-40"
      >
        <Trash size={17} weight="bold" aria-hidden />
        {deleting ? "Suppression…" : "Supprimer l'annonce"}
      </button>
    </form>
  );
}
