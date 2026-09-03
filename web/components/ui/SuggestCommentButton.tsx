"use client";

import { useState } from "react";
import { CheckCircle, ChatText, PaperPlaneTilt, X } from "@phosphor-icons/react";

/**
 * Depuis une fiche existante : proposer un commentaire Koté Moris (ou une
 * correction) sur cette fiche précise. Même contrainte que SuggestPhotoButton
 * — pas de backend d'écriture, donc mailto : vérification manuelle avant
 * intégration à businesses.json, cf. méthodologie données.
 */
export function SuggestCommentButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  function reset() {
    setOpen(false);
    setComment("");
    setSent(false);
  }

  function handleSend() {
    const subject = `Suggestion de commentaire — ${businessName}`;
    const body = [`Fiche : ${businessName} (${businessId})`, `Commentaire : ${comment.trim()}`].join("\n");
    window.location.href = `mailto:mae.bonnart@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary-deep active:scale-[.98]"
      >
        <ChatText size={15} weight="bold" aria-hidden />
        Suggérer un commentaire pour cette fiche
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
        <p className="m-0 text-[12.5px] text-muted leading-snug">Votre appli mail va s'ouvrir : il ne reste plus qu'à envoyer.</p>
        <button onClick={reset} className="text-[12.5px] font-semibold text-primary underline underline-offset-2">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] font-bold text-ink">Suggérer un commentaire pour cette fiche</p>
        <button onClick={reset} aria-label="Annuler" className="text-muted">
          <X size={16} weight="bold" aria-hidden />
        </button>
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Votre avis, une correction, un bon plan…"
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13.5px] shadow-sm focus:outline-none focus:border-primary resize-none"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!comment.trim()}
        className="w-full h-[42px] rounded-xl font-semibold text-[13.5px] text-on-accent flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <PaperPlaneTilt size={16} weight="bold" aria-hidden />
        Envoyer
      </button>
    </div>
  );
}
