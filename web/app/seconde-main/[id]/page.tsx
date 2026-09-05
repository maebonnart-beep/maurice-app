import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mapListingRow } from "@/lib/marketplace/mapRow";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { listingPhotoUrl } from "@/lib/marketplace/constants";
import { whatsappLink } from "@/lib/format";
import { ActionButton } from "@/components/ui/ActionButton";

const ZONE_LABELS: Record<string, string> = {
  nord: "Nord",
  sud: "Sud",
  est: "Est",
  ouest: "Ouest",
  centre: "Centre",
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!data) notFound();

  const listing = mapListingRow(data);
  const categoryLabel = LISTING_CATEGORIES.find((c) => c.key === listing.category)?.label;

  // Comptage de vue, best-effort — n'échoue jamais le rendu de la page.
  await createServiceRoleClient()
    .from("listing_events")
    .insert({ listing_id: listing.id, type: "view" });

  return (
    <div className="max-w-[640px] mx-auto px-4 pb-24 pt-6">
      <Link href="/seconde-main" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted mb-4">
        <ArrowLeft size={16} weight="bold" aria-hidden />
        Retour
      </Link>

      {listing.photos && listing.photos.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4">
          {listing.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={listingPhotoUrl(photo.storagePath)}
              alt=""
              className="h-56 w-auto rounded-2xl object-cover shrink-0 border border-border"
            />
          ))}
        </div>
      ) : (
        <div
          className="h-40 rounded-2xl mb-4 flex items-center justify-center"
          style={{ background: "var(--primary-tint)" }}
        >
          <span className="text-primary-deep text-sm font-semibold">Pas de photo</span>
        </div>
      )}

      {categoryLabel && (
        <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-pill bg-primary-tint text-primary-deep">
          {categoryLabel}
        </span>
      )}
      <h1 className="m-0 mt-1.5 font-serif text-[22px] font-semibold leading-tight">{listing.title}</h1>
      <p className="m-0 mt-1 flex items-center gap-2 text-muted text-[13px]">
        {listing.zone && <span>{ZONE_LABELS[listing.zone] ?? listing.zone}</span>}
      </p>

      {listing.price !== undefined && (
        <p className="m-0 mt-3 font-serif text-[24px] font-semibold text-primary-deep">
          Rs {listing.price.toLocaleString("fr-FR")}
        </p>
      )}

      {listing.description && (
        <p className="m-0 mt-4 text-ink/80 text-[14px] leading-[1.5] whitespace-pre-wrap">
          {listing.description}
        </p>
      )}

      <div className="mt-6">
        <ActionButton href={whatsappLink(listing.whatsapp)} variant="primary" external icon={<WhatsappLogo size={18} weight="fill" aria-hidden />}>
          Contacter par WhatsApp
        </ActionButton>
      </div>
    </div>
  );
}
