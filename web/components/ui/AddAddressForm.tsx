"use client";

import { useState, type FormEvent } from "react";
import { MapPin, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { CATEGORIES, SUBCATEGORIES } from "@/data/categories";
import type { CategoryKey } from "@/lib/types";

const inputClass =
  "w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary";
const labelClass = "block text-[12px] font-semibold text-muted mb-1.5";

type GeoStatus = "idle" | "loading" | "ok" | "denied" | "unavailable";

/** Formulaire « Ajouter une adresse » ouvert depuis le bouton central du bandeau du bas.
 *  Pas de backend d'écriture en production : on prépare un e-mail pré-rempli
 *  vers l'adresse de l'équipe pour vérification manuelle avant intégration
 *  à l'annuaire (cf. méthodologie données — jamais d'ajout automatique). */
export function AddAddressForm() {
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState<CategoryKey | "">("");
  const [rubrique, setRubrique] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [telephone, setTelephone] = useState("");
  const [siteWeb, setSiteWeb] = useState("");
  const [notes, setNotes] = useState("");

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sent, setSent] = useState(false);

  const subcats = categorie ? SUBCATEGORIES[categorie] ?? [] : [];

  function useMyPosition() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !categorie) return;

    const categorieLabel = CATEGORIES.find((c) => c.key === categorie)?.label ?? categorie;
    const rubriqueLabel = subcats.find((s) => s.key === rubrique)?.label ?? rubrique;

    const lignes = [
      `Nom : ${nom}`,
      `Catégorie : ${categorieLabel}`,
      rubriqueLabel && `Rubrique : ${rubriqueLabel}`,
      adresse && `Adresse : ${adresse}`,
      ville && `Ville / région : ${ville}`,
      coords && `Position GPS : ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
      telephone && `Téléphone : ${telephone}`,
      siteWeb && `Site web : ${siteWeb}`,
      notes && `Notes : ${notes}`,
    ].filter(Boolean);

    const subject = `Nouvelle adresse à ajouter — ${nom}`;
    const body = lignes.join("\n");
    const mailto = `mailto:mae.bonnart@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-6 max-w-[420px] mx-auto text-center bg-surface border border-border rounded-2xl shadow-sm p-7 flex flex-col items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-primary-tint text-primary-deep flex items-center justify-center">
          <CheckCircle size={28} weight="duotone" aria-hidden />
        </span>
        <p className="font-serif text-lg font-semibold leading-tight">Merci !</p>
        <p className="text-[13px] text-muted leading-snug">
          Votre appli mail va s'ouvrir avec les infos pré-remplies : il ne reste qu'à envoyer.
          L'adresse sera vérifiée puis ajoutée à l'annuaire.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
          }}
          className="text-[13px] font-semibold text-primary underline underline-offset-2"
        >
          Ajouter une autre adresse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto pb-8 flex flex-col gap-4">
      <div className="text-center flex flex-col items-center gap-2 mb-1">
        <p className="font-serif text-lg font-semibold leading-tight">Ajouter une adresse</p>
        <p className="text-[13px] text-muted leading-snug">
          Suggérez une adresse à ajouter à l'annuaire Koté Moris.
        </p>
      </div>

      <div>
        <label className={labelClass} htmlFor="aa-nom">
          Nom de l'adresse *
        </label>
        <input
          id="aa-nom"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex. Chez Tino"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="aa-categorie">
            Catégorie *
          </label>
          <select
            id="aa-categorie"
            value={categorie}
            onChange={(e) => {
              setCategorie(e.target.value as CategoryKey);
              setRubrique("");
            }}
            required
            className={inputClass}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="aa-rubrique">
            Rubrique
          </label>
          <select
            id="aa-rubrique"
            value={rubrique}
            onChange={(e) => setRubrique(e.target.value)}
            disabled={subcats.length === 0}
            className={inputClass}
          >
            <option value="">Choisir…</option>
            {subcats.map((s) => (
              <option key={s.key} value={s.key}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="aa-adresse">
          Adresse
        </label>
        <input
          id="aa-adresse"
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          placeholder="Rue, lieu-dit…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="aa-ville">
          Ville / région
        </label>
        <input
          id="aa-ville"
          type="text"
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          placeholder="Ex. Grand Baie"
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Position GPS</span>
        <button
          type="button"
          onClick={useMyPosition}
          className="w-full h-[46px] px-4 rounded-xl border border-border bg-surface text-ink text-[14px] font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
        >
          <MapPin size={18} weight="bold" aria-hidden />
          {geoStatus === "loading" && "Localisation…"}
          {geoStatus === "ok" && coords && `Position enregistrée (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`}
          {(geoStatus === "idle" || geoStatus === "denied" || geoStatus === "unavailable") &&
            "Utiliser ma position actuelle"}
        </button>
        {geoStatus === "denied" && (
          <p className="text-[12px] text-red-600 mt-1">
            Position refusée — vous pouvez continuer sans, ou l'autoriser dans les réglages du navigateur.
          </p>
        )}
        {geoStatus === "unavailable" && (
          <p className="text-[12px] text-muted mt-1">Géolocalisation indisponible sur cet appareil.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="aa-tel">
            Téléphone
          </label>
          <input
            id="aa-tel"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="+230…"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="aa-site">
            Site web
          </label>
          <input
            id="aa-site"
            type="url"
            value={siteWeb}
            onChange={(e) => setSiteWeb(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="aa-notes">
          Notes
        </label>
        <textarea
          id="aa-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ce qui vous a plu, un détail utile…"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-ink text-[15px] shadow-sm focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!nom.trim() || !categorie}
        className="w-full h-[48px] rounded-xl font-semibold text-[15px] text-on-accent flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <PaperPlaneTilt size={18} weight="bold" aria-hidden />
        Envoyer la suggestion
      </button>
    </form>
  );
}
