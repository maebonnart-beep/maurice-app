"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type DropdownOption = { key: string; label: string; count?: number; icon?: ReactNode };

/**
 * Menu déroulant de filtre multi-sélection (Cuisine, Prix, Ambiance…).
 * Bouton compact + panneau d'options cochables ; se ferme au clic extérieur / Échap.
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
  const ref = useRef<HTMLDivElement>(null);
  const count = selected.size;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border text-body font-semibold whitespace-nowrap transition-colors ${
          count > 0 ? "bg-primary-tint border-primary text-primary-deep" : "bg-surface border-border text-ink hover:border-primary"
        }`}
      >
        {icon}
        {label}
        {count > 0 && (
          <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold">
            {count}
          </span>
        )}
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 left-0 w-[240px] max-h-[320px] overflow-y-auto rounded-card border border-border bg-surface shadow-pop p-1.5">
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
                    on ? "bg-primary border-primary text-white" : "border-border"
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
        </div>
      )}
    </div>
  );
}
