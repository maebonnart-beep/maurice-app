"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

/** Lien vers l'accueil qui, s'il existe une page précédente dans l'app,
 *  revient dessus (comme la flèche retour du navigateur). Repli : l'accueil
 *  (arrivée directe par lien, PWA fraîchement ouverte…). */
export function HistoryBackLink({
  href,
  "aria-label": ariaLabel,
  className,
  style,
  children,
}: {
  href: string;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={className}
      style={style}
      onClick={(e) => {
        if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
