"use client";

import { useState } from "react";
import { CheckCircle, EnvelopeSimple, PaperPlaneTilt, WarningCircle, X } from "@phosphor-icons/react";
import { openMailto } from "@/lib/format";

/**
 * Entrée "Nous contacter" du menu Mon compte. Même logique que
 * SuggestCommentButton : envoi direct par le serveur (Resend), avec repli
 * sur mailto si l'appel serveur échoue.
 */
export function ContactUsButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [fellBackToMailto, setFellBackToMailto] = useState(false);
  const [sending, setSending] = useState(false);

  function reset() {
    setOpen(false);
    setMessage("");
    setSent(false);
    setFellBackToMailto(false);
  }

  async function handleSend() {
    const subject = "Nous contacter — Koté Moris";
    const body = message.trim();

    setSending(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
    } catch {
      openMailto(`mailto:contact@kotemoris.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      setFellBackToMailto(true);
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 transition-colors"
      >
        <EnvelopeSimple size={18} weight="regular" className="text-muted" aria-hidden />
        <span className="flex-1 text-[13.5px] text-ink">Nous contacter</span>
      </button>
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-1.5 px-4 py-3.5">
        <p className="m-0 flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep">
          {fellBackToMailto ? (
            <WarningCircle size={16} weight="fill" aria-hidden />
          ) : (
            <CheckCircle size={16} weight="fill" aria-hidden />
          )}
          {fellBackToMailto ? "Presque fini !" : "Merci !"}
        </p>
        <p className="m-0 text-[12.5px] text-muted leading-snug">
          {fellBackToMailto
            ? "L'envoi direct a échoué : votre appli mail va s'ouvrir à la place (regardez dans Brouillons si elle ne s'affiche pas automatiquement), il ne reste qu'à appuyer sur Envoyer."
            : "Votre message nous est bien parvenu."}
        </p>
        <button onClick={reset} className="text-[12.5px] font-semibold text-primary underline underline-offset-2">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-center justify-between">
        <p className="m-0 text-[13px] font-bold text-ink">Nous contacter</p>
        <button onClick={reset} aria-label="Annuler" className="text-muted">
          <X size={16} weight="bold" aria-hidden />
        </button>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Une question, une remarque…"
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-ink text-[13.5px] shadow-sm focus:outline-none focus:border-primary resize-none"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={!message.trim() || sending}
        className="w-full h-[42px] rounded-xl font-semibold text-[13.5px] text-on-accent flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        <PaperPlaneTilt size={16} weight="bold" aria-hidden />
        {sending ? "Envoi…" : "Envoyer"}
      </button>
    </div>
  );
}
