"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ListPlus, Check, Plus, X } from "@phosphor-icons/react";
import { useFavoriteLists } from "@/lib/useFavoriteLists";
import { FREE_LIST_LIMIT, LIST_EMOJIS, LIST_LIMITS } from "@/lib/favoriteLists";
import { ListCover } from "./ListCover";

/**
 * 4ᵉ bouton à côté des favoris : range la fiche dans une ou plusieurs listes
 * personnalisées (Supabase, cf. lib/useFavoriteLists.ts). Ouvre une feuille
 * en bas d'écran, rendue dans <body> pour passer au-dessus de la fiche
 * détaillée (z-50) et échapper aux conteneurs en overflow des cartes.
 */
export function AddToListButton({
  businessId,
  businessName,
  size = 18,
  className = "inline-flex items-center justify-center",
}: {
  businessId: string;
  businessName: string;
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { lists, targetListId, toggleBusiness } = useFavoriteLists();
  // Mode ajout (depuis la page d'une liste) : un tap ajoute/retire directement dans cette liste.
  const target = targetListId !== null ? lists.find((l) => l.id === targetListId) : undefined;
  const inTarget = !!target?.businessIds.includes(businessId);
  const inAnyList = lists.some((l) => l.businessIds.includes(businessId));

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (target) toggleBusiness(target, businessId);
          else setOpen(true);
        }}
        aria-label={target ? (inTarget ? `Retirer de « ${target.name} »` : `Ajouter à « ${target.name} »`) : "Ajouter à une liste"}
        aria-pressed={target ? inTarget : undefined}
        title={target ? (inTarget ? `Retirer de « ${target.name} »` : `Ajouter à « ${target.name} »`) : "Ajouter à une liste"}
        className={`${className} active:scale-[.9] transition-transform`}
      >
        {target ? (
          <span
            className={`inline-flex items-center justify-center rounded-full ${
              inTarget ? "bg-primary text-on-primary" : "bg-primary-tint text-primary-deep"
            }`}
            style={{ width: size + 8, height: size + 8 }}
          >
            {inTarget ? <Check size={size - 3} weight="bold" aria-hidden /> : <Plus size={size - 3} weight="bold" aria-hidden />}
          </span>
        ) : (
          <ListPlus
            size={size}
            weight={inAnyList ? "bold" : "regular"}
            style={{ color: inAnyList ? "var(--primary)" : undefined }}
            aria-hidden
          />
        )}
      </button>
      {open &&
        createPortal(
          <AddToListSheet businessId={businessId} businessName={businessName} onClose={() => setOpen(false)} />,
          document.body
        )}
    </>
  );
}

function AddToListSheet({
  businessId,
  businessName,
  onClose,
}: {
  businessId: string;
  businessName: string;
  onClose: () => void;
}) {
  const { status, lists, limitReached, toggleBusiness, create } = useFavoriteLists();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(LIST_EMOJIS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const err = await create({ name, emoji }, businessId);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setName("");
    setCreating(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter à une liste"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[420px] max-h-[80vh] overflow-y-auto bg-surface text-ink rounded-t-3xl sm:rounded-3xl shadow-xl p-5 pb-8 flex flex-col gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="m-0 font-serif text-lg font-semibold leading-tight">Ajouter à une liste</p>
            <p className="m-0 mt-0.5 text-[12.5px] text-muted truncate">{businessName}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted">
            <X size={18} weight="bold" aria-hidden />
          </button>
        </div>

        {status === "loading" || status === "idle" ? (
          <p className="text-center text-muted text-[13px] py-4">Chargement…</p>
        ) : status === "anon" ? (
          <div className="flex flex-col gap-3 items-start">
            <p className="m-0 text-[13px] text-muted leading-snug">
              Connecte-toi pour créer tes propres listes (« Restos à tester », « Visite des parents »…) et les
              retrouver sur tous tes appareils.
            </p>
            <Link
              href="/mon-compte"
              className="h-[42px] px-4 rounded-xl font-semibold text-[13.5px] text-on-primary bg-primary inline-flex items-center"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <>
            {lists.length > 0 ? (
              <div className="flex flex-col gap-1">
                {lists.map((list) => {
                  const inList = list.businessIds.includes(businessId);
                  return (
                    <button
                      key={list.id}
                      onClick={() => toggleBusiness(list, businessId)}
                      aria-pressed={inList}
                      className="flex items-center gap-3 p-2 -mx-2 rounded-xl text-left hover:bg-primary-tint/60 active:scale-[.99] transition-transform"
                    >
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-tint flex items-center justify-center text-lg" aria-hidden>
                        <ListCover emoji={list.emoji} size={32} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold truncate">{list.name}</span>
                        <span className="block text-[11.5px] text-muted truncate">
                          {list.businessIds.length} adresse{list.businessIds.length > 1 ? "s" : ""}
                          {list.period ? ` · ${list.period}` : ""}
                        </span>
                      </span>
                      <span
                        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                          inList ? "bg-primary border-primary text-on-primary" : "border-border"
                        }`}
                        aria-hidden
                      >
                        {inList && <Check size={13} weight="bold" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="m-0 text-[13px] text-muted">Tu n&apos;as pas encore de liste : crée la première !</p>
            )}

            {limitReached ? (
              <Link
                href="/mon-compte/upgrade"
                className="flex items-center justify-between gap-3 bg-primary-tint border border-primary/20 rounded-xl p-3"
              >
                <span className="text-[12.5px] text-primary-deep font-medium">
                  {FREE_LIST_LIMIT} listes gratuites utilisées : passe premium pour en créer d&apos;autres.
                </span>
                <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">Premium</span>
              </Link>
            ) : creating ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-2.5 pt-3 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {LIST_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      aria-pressed={emoji === e}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                        emoji === e ? "border-primary bg-primary-tint" : "border-transparent"
                      }`}
                    >
                      <ListCover emoji={e} size={32} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={name}
                    maxLength={LIST_LIMITS.name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de la liste"
                    className="flex-1 min-w-0 h-[44px] px-4 rounded-xl border border-border bg-surface text-ink text-[14px] shadow-sm focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={saving || !name.trim()}
                    className="shrink-0 h-[44px] px-4 rounded-xl font-semibold text-[13.5px] text-on-primary bg-primary disabled:opacity-40"
                  >
                    Créer
                  </button>
                </div>
                {error && <p className="m-0 text-[12.5px] text-red-600">{error}</p>}
              </form>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="self-start inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-deep"
              >
                <Plus size={15} weight="bold" aria-hidden /> Nouvelle liste
              </button>
            )}

            {lists.length > 0 && (
              <Link href="/mon-compte/listes" className="text-[12.5px] text-muted underline underline-offset-2 self-start">
                Gérer mes listes (description, période, notes…)
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
