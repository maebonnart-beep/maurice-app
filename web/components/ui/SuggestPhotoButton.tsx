"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle, PaperPlaneTilt, X } from "@phosphor-icons/react";

/**
 * Depuis une fiche existante : envoyer une photo terrain (+ une note) pour
 * compléter cette fiche précise. Même contrainte que AddAddressForm — pas de
 * backend d'écriture, donc partage natif (avec pièce jointe) si possible,
 * sinon mailto (sans pièce jointe, à joindre à la main) : vérification
 * manuelle avant intégration à businesses.json, cf. méthodologie données.
 */
export function SuggestPhotoButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [photoShared, setPhotoShared] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  function reset() {
    setOpen(false);
    setPhoto(null);
    setNote("");
    setSent(false);
  }

  async function handleSend() {
    const subject = `Photo pour compléter la fiche — ${businessName}`;
    const body = [`Fiche : ${businessName} (${businessId})`, note.trim() && `Note : ${note.trim()}`]
      .filter(Boolean)
      .join("\n");

    if (photo && typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [photo] })) {
      try {
        await navigator.share({ title: subject, text: `${body}\n\nÀ : mae.bonnart@gmail.com`, files: [photo] });
        setPhotoShared(true);
        setSent(true);
        return;
      } catch {
        // Partage annulé/indisponible : on retombe sur le mailto ci-dessous.
      }
    }

    const mailto = `mailto:mae.bonnart@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setPhotoShared(false);
    setSent(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary-deep active:scale-[.98]"
      >
        <Camera size={15} weight="bold" aria-hidden />
        Suggérer une photo pour cette fiche
      </button>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-1.5 pt-1 border-t border-border">
        <p className="m-0 flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep">
          <CheckCircle size={16} weight="fill" aria-hidden />
          Merci !
        </p>
        <p className="m-0 text-[12.5px] text-muted leading-snug">
          {photoShared
            ? "Il ne reste qu'à valider l'envoi dans l'appli qui vient de s'ouvrir."
            : "Votre appli mail va s'ouvrir : pensez à joindre la photo, puis envoyer."}
        </p>
        <button onClick={reset} className="text-[12.5px] font-semibold text-primary underline underline-offset-2">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] font-bold text-ink">Suggérer une photo pour cette fiche</p>
        <button onClick={reset} aria-label="Annuler" className="text-muted">
          <X size={16} weight="bold" aria-hidden />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {photoUrl ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border">
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
          className="w-full h-[42px] px-4 rounded-xl border border-border bg-surface text-ink text-[13.5px] font-semibold shadow-sm flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
        >
          <Camera size={17} weight="bold" aria-hidden />
          Prendre ou choisir une photo
        </button>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Un détail utile (facultatif)…"
        rows={2}
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13.5px] shadow-sm focus:outline-none focus:border-primary resize-none"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!photo && !note.trim()}
        className="w-full h-[42px] rounded-xl font-semibold text-[13.5px] text-on-accent flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <PaperPlaneTilt size={16} weight="bold" aria-hidden />
        Envoyer
      </button>
    </div>
  );
}
