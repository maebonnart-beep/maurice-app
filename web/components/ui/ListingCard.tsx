import Link from "next/link";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Listing } from "@/lib/marketplace/types";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { listingPhotoUrl } from "@/lib/marketplace/constants";

const ZONE_LABELS: Record<string, string> = {
  nord: "Nord",
  sud: "Sud",
  est: "Est",
  ouest: "Ouest",
  centre: "Centre",
};

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Carte annonce seconde-main : photo, titre, prix, zone — mêmes tokens/rythme que BusinessCard. */
export function ListingCard({ listing }: { listing: Listing }) {
  const coverPath = listing.photos?.[0]?.storagePath;
  const categoryLabel = LISTING_CATEGORIES.find((c) => c.key === listing.category)?.label;

  return (
    <Link
      href={`/seconde-main/${listing.id}`}
      className="block bg-surface border border-border rounded-card p-2.5 shadow-card flex items-center gap-3 no-underline text-ink"
    >
      <span
        className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: "var(--primary-tint)" }}
        aria-hidden
      >
        {coverPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listingPhotoUrl(coverPath)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-primary-deep text-xs font-semibold">Photo</span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        {categoryLabel && (
          <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-pill bg-primary-tint text-primary-deep">
            {categoryLabel}
          </span>
        )}
        <h3 className="m-0 mt-0.5 font-serif text-[15px] font-semibold leading-[1.2] truncate">
          {listing.title}
        </h3>
        <p className="m-0 mt-0.5 text-muted text-[12.5px] leading-[1.4] flex items-center gap-1">
          {listing.zone && (
            <>
              <MapPin size={12} weight="fill" className="shrink-0 opacity-70" aria-hidden />
              <span>{ZONE_LABELS[listing.zone] ?? listing.zone}</span>
              <span>·</span>
            </>
          )}
          <span>{relativeDate(listing.createdAt)}</span>
        </p>
      </div>
      {listing.price !== undefined && (
        <span className="shrink-0 font-serif text-[16px] font-semibold text-primary-deep">
          Rs {listing.price.toLocaleString("fr-FR")}
        </span>
      )}
    </Link>
  );
}
