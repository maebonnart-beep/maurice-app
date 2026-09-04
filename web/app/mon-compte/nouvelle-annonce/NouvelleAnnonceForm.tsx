"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, X, CheckCircle } from "@phosphor-icons/react";
import { LISTING_CATEGORIES, type ListingCategoryKey, type ListingZone } from "@/lib/marketplace/types";

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

export function NouvelleAnnonceForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategoryKey | "">("");
  const [price, setPrice] = useState("");
  const [zone, setZone] = useState<ListingZone | "">("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category || !whatsapp.trim()) return;
    setSubmitting(true);
    setError(null);
    setNeedsUpgrade(false);

    const res = await fetch("/api/listings", {
      method: "POST",
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
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue.");
      setNeedsUpgrade(res.status === 403 && !!json.error?.includes("abonnement"));
      setSubmitting(false);
      return;
    }

    if (photo) {
      const formData = new FormData();
      formData.append("file", photo);
      await fetch(`/api/listings/${json.listing.id}/photos`, { method: "POST", body: formData });
    }

    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 mt-10 flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
          <CheckCircle size={28} weight="duotone" aria-hidden />
        </span>
        <p className="font-serif text-lg font-semibold leading-tight">Annonce envoyée</p>
        <p className="text-[13px] text-muted leading-snug">
          Elle sera visible dès sa validation par l&apos;équipe.
        </p>
        <button
          onClick={() => router.push("/mon-compte")}
          className="text-[13px] font-semibold text-primary underline underline-offset-2"
        >
          Voir mes annonces
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-4">
      <div className="text-center flex flex-col items-center gap-2 mb-1">
        <p className="font-serif text-lg font-semibold leading-tight">Déposer une annonce</p>
        <p className="text-[13px] text-muted leading-snug">
          Elle sera validée par l&apos;équipe avant publication.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="na-titre">
          Titre *
        </label>
        <input
          id="na-titre"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Canapé 3 places"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="na-categorie">
            Catégorie *
          </label>
          <select
            id="na-categorie"
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
          <label className={labelClass} htmlFor="na-zone">
            Zone
          </label>
          <select
            id="na-zone"
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
        <label className={labelClass} htmlFor="na-prix">
          Prix (Rs)
        </label>
        <input
          id="na-prix"
          type="number"
          min="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ex. 3500"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="na-whatsapp">
          Numéro WhatsApp de contact *
        </label>
        <input
          id="na-whatsapp"
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+230…"
          required
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Photo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        {photoUrl ? (
          <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Photo choisie" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setPhoto(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Retirer la photo"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X size={15} weight="bold" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[14px] font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
          >
            <Camera size={18} weight="bold" aria-hidden />
            Choisir une photo
          </button>
        )}
      </div>

      <div>
        <label className={labelClass} htmlFor="na-description">
          Description
        </label>
        <textarea
          id="na-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>

      {error && (
        <p className="text-[12.5px] text-red-600 text-center">
          {error}
          {needsUpgrade && (
            <>
              {" "}
              <Link href="/mon-compte/upgrade" className="underline font-semibold">
                S&apos;abonner
              </Link>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !title.trim() || !category || !whatsapp.trim()}
        className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-white bg-primary active:scale-[.98] transition-transform disabled:opacity-40"
      >
        {submitting ? "Envoi…" : "Envoyer pour validation"}
      </button>
    </form>
  );
}
