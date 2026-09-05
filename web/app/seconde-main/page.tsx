import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/ui/ListingCard";
import { LISTING_CATEGORIES } from "@/lib/marketplace/types";
import { mapListingRow } from "@/lib/marketplace/mapRow";

export const metadata = { title: "Seconde main — Maurice+" };

export default async function SecondeMainPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>;
}) {
  const { categorie } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("status", "approved")
    .order("approved_at", { ascending: false });

  if (categorie) {
    query = query.eq("category", categorie);
  }

  const { data } = await query;
  const listings = (data ?? []).map(mapListingRow);

  return (
    <div className="max-w-[640px] mx-auto px-4 pb-24 pt-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="font-serif text-xl font-semibold leading-tight">Seconde main</p>
          <p className="text-[13px] text-muted">Entre particuliers, contact direct par WhatsApp</p>
        </div>
        <Link
          href="/mon-compte/nouvelle-annonce"
          className="shrink-0 h-[40px] px-4 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
        >
          Déposer
        </Link>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <Link
          href="/seconde-main"
          className={`text-[12.5px] font-semibold px-2.5 py-1 rounded-pill border ${
            !categorie ? "bg-primary text-white border-primary" : "border-border text-ink"
          }`}
        >
          Tout
        </Link>
        {LISTING_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/seconde-main?categorie=${c.key}`}
            className={`text-[12.5px] font-semibold px-2.5 py-1 rounded-pill border ${
              categorie === c.key ? "bg-primary text-white border-primary" : "border-border text-ink"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <p className="text-center text-muted text-[13px] mt-10">Aucune annonce pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
