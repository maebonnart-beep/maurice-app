"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type DropdownOption = { key: string; label: string; count?: number; icon?: ReactNode };

/**
 * Menu déroulant de filtre multi-sélection (Cuisine, Prix, Ambiance…).
 * Bouton compact + panneau d'options cochables ; se ferme au clic extérieur / Échap.
 *
 * Le panneau est rendu dans un portail (position fixed, coordonnées calculées
 * depuis le bouton) plutôt qu'en `absolute` dans le flux : la barre de filtres
 * qui le contient défile horizontalement (overflow-x-auto, ce qui force aussi
 * overflow-y à clipper) et sans portail le menu se retrouvait tronqué / caché
 * sous les fiches de résultats en dessous.
 */
export function FilterDropdown({
  label,
  icon,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  icon?: ReactNode;
  options: DropdownOption[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const count = selected.size;

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = 240;
      const left = Math.min(r.left, window.innerWidth - width - 8);
      setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-body font-semibold transition-colors ${
          count > 0 ? "bg-primary-tint border-primary text-primary-deep" : "bg-surface border-border text-ink hover:border-primary"
        }`}
      >
        {icon}
        <span className="truncate">{label}</span>
        {count > 0 && (
          <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-primary text-on-primary text-[11px] font-bold shrink-0">
            {count}
          </span>
        )}
        <span className={`ml-auto text-[10px] transition-transform shrink-0 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: 240 }}
            className="z-50 max-h-[320px] overflow-y-auto rounded-card border border-border bg-surface shadow-pop p-1.5"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted/80">{label}</span>
              {count > 0 && (
                <button onClick={onClear} className="text-[12px] font-semibold text-primary-deep hover:underline">
                  Effacer
                </button>
              )}
            </div>
            {options.map((o) => {
              const on = selected.has(o.key);
              return (
                <button
                  key={o.key}
                  onClick={() => onToggle(o.key)}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-left transition-colors ${
                    on ? "bg-primary-tint text-primary-deep font-semibold" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[11px] ${
                      on ? "bg-primary border-primary text-on-primary" : "border-border"
                    }`}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {o.icon}
                  <span className="flex-1 truncate">{o.label}</span>
                  {o.count !== undefined && (
                    <span className="text-[11px] font-bold opacity-55 shrink-0">{o.count}</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
