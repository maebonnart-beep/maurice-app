"use client";

/** Champ de recherche du design system, avec icône intégrée. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Focalise le champ dès son montage (pour ouvrir le clavier mobile
   *  sans délai, dans le même geste que le clic qui l'a fait apparaître). */
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Rechercher"
        autoComplete="off"
        autoFocus={autoFocus}
        className="w-full h-[46px] pl-11 pr-4 rounded-pill border border-border bg-surface text-ink text-base shadow-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}
