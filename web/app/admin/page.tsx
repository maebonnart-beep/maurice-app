import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Admin — Koté Moris" };

function AdminTile({
  href,
  icon,
  label,
  description,
  disabled,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  const content = (
    <div
      className={`flex flex-col items-center text-center gap-2 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-transform ${
        disabled ? "opacity-50" : "active:scale-[.98]"
      }`}
    >
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <span className="font-serif text-lg font-semibold leading-tight">{label}</span>
      <span className="text-[13px] text-muted leading-snug">{description}</span>
      {disabled && <span className="text-[11px] font-semibold text-muted">Bientôt</span>}
    </div>
  );

  if (disabled || !href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-bg text-ink p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Admin — Koté Moris</h1>
      <div className="grid grid-cols-2 gap-4">
        <AdminTile
          href="/admin/utilisateurs"
          icon="👤"
          label="Utilisateurs"
          description="Rôles admin & communauté"
        />
        <AdminTile
          href="/admin/seconde-main"
          icon="🛍️"
          label="Annonces"
          description="Modération seconde main"
        />
        <AdminTile
          href="/admin/fiches"
          icon="📝"
          label="Fiches"
          description="Modifs rapides (local uniquement)"
        />
        <AdminTile
          icon="📊"
          label="Dashboard"
          description="Flux & inscriptions"
          disabled
        />
      </div>
    </div>
  );
}
