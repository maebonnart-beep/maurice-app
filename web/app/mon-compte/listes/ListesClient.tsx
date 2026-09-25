"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash, ShareNetwork, Check, PencilSimple, X, Plus, MapPin, CaretUp, CaretDown } from "@phosphor-icons/react";
import { useFavorites } from "@/lib/favorites";
import { useFavoriteLists } from "@/lib/useFavoriteLists";
import { getBusinesses } from "@/lib/data";
import type { Business } from "@/lib/types";
import { displayName, displayCity } from "@/lib/format";
import { FREE_LIST_LIMIT, LIST_EMOJIS, LIST_LIMITS, type FavoriteList, type ListInfo } from "@/lib/favoriteLists";
import { BackButton } from "@/components/ui/BackButton";
import { ListCover } from "@/components/ui/ListCover";

const inputClass =
  "w-full h-[44px] px-4 rounded-xl border border-border bg-surface text-ink text-[14px] shadow-sm focus:outline-none focus:border-primary";
const textareaClass =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-ink text-[14px] shadow-sm focus:outline-none focus:border-primary resize-none";

export function ListesClient({ listId, startCreating }: { listId: number | null; startCreating: boolean }) {
  const store = useFavoriteLists();
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    getBusinesses().then(setBusinesses);
  }, []);

  if (store.status === "idle" || store.status === "loading") {
    return (
      <Shell title="Mes listes">
        <p className="text-center text-muted text-[13px]">Chargement…</p>
      </Shell>
    );
  }

  const list = listId !== null ? store.lists.find((l) => l.id === listId) : undefined;
  if (list) return <ListDetail list={list} businesses={businesses} />;

  return <ListIndex businesses={businesses} startCreating={startCreating} />;
}

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[560px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <BackButton className="-ml-1 mt-0.5" />
        <div className="min-w-0">
          <p className="font-serif text-xl font-semibold leading-tight">{title}</p>
          {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Vue index : toutes les listes + création ─────────────────────────────

function ListIndex({ businesses, startCreating }: { businesses: Business[]; startCreating: boolean }) {
  const { lists, isPremium, limitReached, create } = useFavoriteLists();
  const [creating, setCreating] = useState(startCreating);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(info: ListInfo & { name: string }) {
    setError(null);
    const err = await create(info);
    if (err) setError(err);
    else setCreating(false);
  }

  return (
    <Shell
      title="Mes listes"
      subtitle="Crée tes propres listes d'adresses, avec une description, une période et tes notes."
    >
      {lists.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {lists.map((list) => {
            const names = businesses.filter((b) => list.businessIds.includes(b.id)).map((b) => displayName(b.name));
            return (
              <Link
                key={list.id}
                href={`/mon-compte/listes?id=${list.id}`}
                className="bg-surface border border-border rounded-2xl p-3.5 flex items-start gap-3 no-underline text-ink"
              >
                <span className="w-11 h-11 shrink-0 rounded-xl bg-primary-tint flex items-center justify-center text-xl" aria-hidden>
                  <ListCover emoji={list.emoji} size={34} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold truncate">{list.name}</span>
                  <span className="block text-[11.5px] text-muted">
                    {list.businessIds.length} adresse{list.businessIds.length > 1 ? "s" : ""}
                    {list.period ? ` · ${list.period}` : ""}
                    {list.shareToken ? " · partagée" : ""}
                  </span>
                  {list.description ? (
                    <span className="block mt-1 text-[12.5px] text-ink/70 line-clamp-2">{list.description}</span>
                  ) : names.length > 0 ? (
                    <span className="block mt-1 text-[12px] text-muted truncate">{names.join(" · ")}</span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        !creating && (
          <p className="text-[13px] text-muted text-center">
            Pas encore de liste. Crée-en une ici, ou depuis une fiche avec le bouton « Ajouter à une liste ».
          </p>
        )
      )}

      {limitReached ? (
        <Link
          href="/mon-compte/upgrade"
          className="flex items-center justify-between gap-3 bg-primary-tint border border-primary/20 rounded-xl p-3.5"
        >
          <span className="text-[13px] text-primary-deep font-medium">
            {FREE_LIST_LIMIT}/{FREE_LIST_LIMIT} listes gratuites : passe premium pour en créer autant que tu veux.
          </span>
          <span className="shrink-0 text-[12.5px] font-semibold text-primary-deep underline">S&apos;abonner</span>
        </Link>
      ) : creating ? (
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
          <p className="m-0 text-[14px] font-bold">Nouvelle liste</p>
          <ListInfoForm submitLabel="Créer la liste" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
          {error && <p className="m-0 text-[12.5px] text-red-600">{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="h-[44px] rounded-xl font-semibold text-[13.5px] text-on-primary bg-primary inline-flex items-center justify-center gap-1.5 active:scale-[.98] transition-transform"
        >
          <Plus size={16} weight="bold" aria-hidden /> Nouvelle liste
        </button>
      )}

      {!isPremium && !limitReached && (
        <p className="m-0 text-[12px] text-muted text-center">
          {lists.length}/{FREE_LIST_LIMIT} listes gratuites utilisées · illimité en premium
        </p>
      )}
    </Shell>
  );
}

// ─── Formulaire d'infos (création et édition) ──────────────────────────────

function ListInfoForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: FavoriteList;
  submitLabel: string;
  onSubmit: (info: ListInfo & { name: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? LIST_EMOJIS[0]);
  const [period, setPeriod] = useState(initial?.period ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  // Saisie d'un emoji libre, ouverte par la pastille « … » (ou d'office si l'emoji actuel n'est pas une suggestion).
  const [customOpen, setCustomOpen] = useState(!!initial?.emoji && !LIST_EMOJIS.includes(initial.emoji));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({ name, emoji, period, description });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5 items-center">
        {LIST_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              setEmoji(e);
              setCustomOpen(false);
            }}
            aria-pressed={emoji === e}
            className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              emoji === e ? "border-primary bg-primary-tint" : "border-transparent"
            }`}
          >
            <ListCover emoji={e} size={32} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          aria-pressed={customOpen}
          aria-label="Autre emoji"
          className={`h-11 px-1 rounded-xl flex items-center justify-center border ${
            customOpen ? "border-primary bg-primary-tint" : "border-transparent"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/list-icons/autre.webp" alt="" aria-hidden className="h-7 w-auto" />
        </button>
        {customOpen && (
          <input
            type="text"
            autoFocus
            value={LIST_EMOJIS.includes(emoji) ? "" : emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={LIST_LIMITS.emoji}
            placeholder="Ton emoji"
            aria-label="Emoji personnalisé"
            className="w-[96px] h-11 px-2 rounded-xl border border-border bg-surface text-center text-[18px] focus:outline-none focus:border-primary"
          />
        )}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={LIST_LIMITS.name}
        placeholder="Nom (ex. Visite des parents)"
        className={inputClass}
        autoFocus={!initial}
      />
      <input
        type="text"
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        maxLength={LIST_LIMITS.period}
        placeholder="Période (facultatif, ex. Vacances de Noël)"
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={LIST_LIMITS.description}
        rows={3}
        placeholder="Description (facultatif)"
        className={textareaClass}
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="h-[40px] px-4 rounded-xl text-[13.5px] font-semibold text-muted">
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="h-[40px] px-4 rounded-xl font-semibold text-[13.5px] text-on-primary bg-primary disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Vue détail d'une liste ────────────────────────────────────────────────

function ListDetail({ list, businesses }: { list: FavoriteList; businesses: Business[] }) {
  const router = useRouter();
  const { update, toggleBusiness, setNote, toggleShare, remove, reorder } = useFavoriteLists();
  const { favoriteIds } = useFavorites();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  // Lien affiché en clair si le presse-papiers est refusé (navigateur, permissions).
  const [manualLink, setManualLink] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Garde l'ordre d'ajout de la liste (pas celui de businesses.json).
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const listBusinesses = list.businessIds.map((id) => byId.get(id)).filter((b): b is Business => !!b);
  const favoritesNotInList = businesses.filter((b) => favoriteIds.has(b.id) && !list.businessIds.includes(b.id));

  /** Échange une fiche avec sa voisine (dir = -1 : monter, +1 : descendre). */
  function move(index: number, dir: -1 | 1) {
    const visible = listBusinesses.map((b) => b.id);
    const target = index + dir;
    if (target < 0 || target >= visible.length) return;
    [visible[index], visible[target]] = [visible[target], visible[index]];
    // Les ids absents de businesses.json (fiche retirée de l'annuaire) restent en fin de liste.
    const hidden = list.businessIds.filter((id) => !visible.includes(id));
    reorder(list, [...visible, ...hidden]);
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/liste/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setManualLink(url);
    }
  }

  async function handleShare() {
    if (list.shareToken) return copyLink(list.shareToken);
    const updated = await toggleShare(list);
    if (updated?.shareToken) await copyLink(updated.shareToken);
  }

  async function handleDelete() {
    await remove(list.id);
    router.replace("/mon-compte/listes");
  }

  return (
    <div className="w-full max-w-[560px] mx-auto px-4 pb-24 pt-6 flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <Link
          href="/mon-compte/listes"
          aria-label="Toutes mes listes"
          className="shrink-0 -ml-1 mt-2 w-7 h-7 rounded-full flex items-center justify-center text-ink"
        >
          <X size={17} weight="bold" aria-hidden />
        </Link>
        {!editing && (
          <div className="flex-1 min-w-0 flex items-start gap-3">
            <span className="w-12 h-12 shrink-0 rounded-2xl bg-primary-tint flex items-center justify-center text-2xl" aria-hidden>
              <ListCover emoji={list.emoji} size={38} />
            </span>
            <div className="min-w-0">
              <h1 className="m-0 font-serif text-xl font-semibold leading-tight break-words">{list.name}</h1>
              <p className="m-0 text-[12.5px] text-muted">
                {list.businessIds.length} adresse{list.businessIds.length > 1 ? "s" : ""}
                {list.period ? ` · ${list.period}` : ""}
              </p>
            </div>
          </div>
        )}
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="Modifier les infos"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-primary-deep"
          >
            <PencilSimple size={17} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      {editing ? (
        <div className="bg-surface border border-border rounded-2xl p-4">
          <ListInfoForm
            initial={list}
            submitLabel="Enregistrer"
            onSubmit={async (info) => {
              await update(list.id, info);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        list.description && <p className="m-0 text-[13.5px] text-ink/80 leading-relaxed whitespace-pre-line">{list.description}</p>
      )}

      {/* Actions : partage + suppression */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleShare}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-[12.5px] font-bold border ${
            list.shareToken ? "bg-primary-tint border-primary/20 text-primary-deep" : "border-border text-ink"
          }`}
        >
          {copied ? <Check size={15} weight="bold" aria-hidden /> : <ShareNetwork size={15} weight="bold" aria-hidden />}
          {copied ? "Lien copié !" : list.shareToken ? "Copier le lien" : "Partager"}
        </button>
        {list.shareToken && (
          <button onClick={() => toggleShare(list)} className="text-[12px] text-muted underline underline-offset-2">
            Arrêter le partage
          </button>
        )}
        <span className="flex-1" />
        {confirmDelete ? (
          <span className="inline-flex items-center gap-2 text-[12.5px]">
            Supprimer la liste ?
            <button onClick={handleDelete} className="font-bold text-red-600">Oui</button>
            <button onClick={() => setConfirmDelete(false)} className="font-semibold text-muted">Non</button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label="Supprimer la liste"
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-red-600"
          >
            <Trash size={17} weight="bold" aria-hidden />
          </button>
        )}
      </div>

      {manualLink && list.shareToken && (
        <input
          readOnly
          value={manualLink}
          onFocus={(e) => e.target.select()}
          aria-label="Lien de partage"
          className="w-full h-[40px] px-3 rounded-xl border border-border bg-surface text-[12.5px] text-ink"
        />
      )}

      {/* Fiches de la liste, avec note perso */}
      {listBusinesses.length === 0 ? (
        <p className="m-0 text-[13px] text-muted text-center py-4">
          Liste vide pour l&apos;instant. Ajoute des adresses depuis n&apos;importe quelle fiche avec le bouton « Ajouter à une liste ».
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listBusinesses.map((b, i) => (
            <ListItem
              key={b.id}
              business={b}
              note={list.notes[b.id] ?? ""}
              onSaveNote={(note) => setNote(list, b.id, note)}
              onRemove={() => toggleBusiness(list, b.id)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={i < listBusinesses.length - 1 ? () => move(i, 1) : undefined}
            />
          ))}
        </div>
      )}

      {/* Raccourci : ajouter depuis ses favoris */}
      {favoritesNotInList.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-3.5">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-between text-[13px] font-semibold text-primary-deep"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus size={15} weight="bold" aria-hidden /> Ajouter depuis mes favoris ({favoritesNotInList.length})
            </span>
          </button>
          {pickerOpen && (
            <div className="mt-2.5 pt-2.5 border-t border-border flex flex-col gap-1">
              {favoritesNotInList.map((b) => (
                <button
                  key={b.id}
                  onClick={() => toggleBusiness(list, b.id)}
                  className="flex items-center gap-2 py-1.5 text-left text-[13px]"
                >
                  <Plus size={13} weight="bold" className="shrink-0 text-muted" aria-hidden />
                  <span className="truncate">{displayName(b.name)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListItem({
  business: b,
  note,
  onSaveNote,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  business: Business;
  note: string;
  onSaveNote: (note: string) => void;
  onRemove: () => void;
  /** Absent pour la première (resp. dernière) fiche. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const name = displayName(b.name);
  // Brouillon local, initialisé une fois : la note n'est modifiée que depuis ce champ.
  const [draft, setDraft] = useState(note);

  return (
    <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {(onMoveUp || onMoveDown) && (
          <div className="shrink-0 -ml-1 flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={!onMoveUp}
              aria-label={`Monter ${name}`}
              className="w-7 h-6 rounded-md flex items-center justify-center text-muted hover:text-primary-deep disabled:opacity-25 active:scale-[.9]"
            >
              <CaretUp size={14} weight="bold" aria-hidden />
            </button>
            <button
              onClick={onMoveDown}
              disabled={!onMoveDown}
              aria-label={`Descendre ${name}`}
              className="w-7 h-6 rounded-md flex items-center justify-center text-muted hover:text-primary-deep disabled:opacity-25 active:scale-[.9]"
            >
              <CaretDown size={14} weight="bold" aria-hidden />
            </button>
          </div>
        )}
        <Link href={`/?open=${b.id}`} className="flex-1 min-w-0 no-underline text-ink">
          <span className="block font-serif text-[15px] font-semibold leading-tight truncate">{displayName(b.name)}</span>
          <span className="mt-0.5 text-[12px] text-muted flex items-center gap-1 truncate">
            <MapPin size={12} weight="fill" className="shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{displayCity(b.address)}</span>
          </span>
        </Link>
        <button
          onClick={onRemove}
          aria-label={`Retirer ${displayName(b.name)} de la liste`}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-600"
        >
          <X size={15} weight="bold" aria-hidden />
        </button>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft.trim() !== note && onSaveNote(draft)}
        maxLength={LIST_LIMITS.note}
        rows={1}
        placeholder="Ma note (ex. prendre le curry de poulpe)"
        className="w-full px-3 py-2 rounded-xl border border-border bg-bg text-ink text-[13px] focus:outline-none focus:border-primary resize-none field-sizing-content"
      />
    </div>
  );
}
