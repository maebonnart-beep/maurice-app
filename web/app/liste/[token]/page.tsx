import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getBusinesses } from "@/lib/data";
import { CATEGORY_MAP } from "@/data/categories";
import { displayName, displayCity } from "@/lib/format";

export const metadata = { title: "Liste partagée — Koté Moris" };

/**
 * Vue publique d'une liste de favoris partagée. Aucun grant anon sur
 * favorite_lists (cf. schema.sql) : on passe par la clé service-role, qui
 * bypass RLS — cette route est le seul chemin d'accès à la table pour un
 * visiteur non connecté, et elle ne révèle que la liste du token demandé.
 */
export default async function SharedListPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: list } = await createServiceRoleClient()
    .from("favorite_lists")
    .select("name, business_ids")
    .eq("share_token", token)
    .single();

  if (!list) notFound();

  const businessIds = (list.business_ids as string[]) ?? [];
  const businesses = (await getBusinesses()).filter((b) => businessIds.includes(b.id));

  return (
    <div className="max-w-[640px] mx-auto px-4 pb-24 pt-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted mb-4">
        Koté Moris
      </Link>

      <p className="text-[12.5px] font-semibold text-primary-deep uppercase tracking-wide mb-1">
        Liste partagée
      </p>
      <h1 className="m-0 font-serif text-[24px] font-semibold leading-tight">{list.name}</h1>
      <p className="text-[13px] text-muted mt-1 mb-5">
        {businesses.length} adresse{businesses.length > 1 ? "s" : ""} — depuis Koté Moris
      </p>

      {businesses.length === 0 ? (
        <p className="text-center text-muted text-[13px] mt-10">Cette liste est vide.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {businesses.map((b) => {
            const cat = CATEGORY_MAP[b.category];
            return (
              <Link
                key={b.id}
                href={`/?open=${b.id}`}
                className="block bg-surface border border-border rounded-card p-3 flex items-center gap-3 no-underline text-ink"
              >
                <span
                  className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
                  style={{ background: "var(--primary-tint)" }}
                  aria-hidden
                >
                  {cat?.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="m-0 font-serif text-[15px] font-semibold leading-[1.2] truncate">
                    {displayName(b.name)}
                  </h3>
                  <p className="m-0 mt-0.5 text-muted text-[12.5px] leading-[1.4] flex items-center gap-1 truncate">
                    <MapPin size={12} weight="fill" className="shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{displayCity(b.address)}</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-center text-[12px] text-muted mt-8">
        Découvrez Maurice sur{" "}
        <Link href="/" className="font-semibold text-primary-deep underline">
          Koté Moris
        </Link>
      </p>
    </div>
  );
}
