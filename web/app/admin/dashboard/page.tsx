import Link from "next/link";
import type { ReactNode } from "react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — Maurice+" };

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const LISTING_STATUSES = ["pending", "approved", "rejected", "expired", "sold"] as const;
const BUSINESS_EVENT_TYPES = ["call", "website", "directions", "whatsapp"] as const;
const LISTING_EVENT_TYPES = ["view", "whatsapp"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function count(client: ReturnType<typeof createServiceRoleClient>, table: string, filters: (q: any) => any) {
  const query = filters(client.from(table).select("*", { count: "exact", head: true }));
  return query.then(({ count: n }: { count: number | null }) => n ?? 0);
}

async function loadStats() {
  const supabase = createServiceRoleClient();
  const since7d = SEVEN_DAYS_AGO();

  const [
    totalUsers,
    newUsers7d,
    communityMembers,
    admins,
    premiumActive,
    totalListings,
    newListings7d,
    ...rest
  ] = await Promise.all([
    count(supabase, "profiles", (q) => q),
    count(supabase, "profiles", (q) => q.gte("created_at", since7d)),
    count(supabase, "profiles", (q) => q.eq("is_community_member", true)),
    count(supabase, "profiles", (q) => q.eq("is_admin", true)),
    count(supabase, "profiles", (q) => q.eq("subscription_status", "active")),
    count(supabase, "listings", (q) => q),
    count(supabase, "listings", (q) => q.gte("created_at", since7d)),
    ...LISTING_STATUSES.map((status) => count(supabase, "listings", (q) => q.eq("status", status))),
    ...BUSINESS_EVENT_TYPES.map((type) => count(supabase, "business_events", (q) => q.eq("type", type))),
    ...BUSINESS_EVENT_TYPES.map((type) =>
      count(supabase, "business_events", (q) => q.eq("type", type).gte("created_at", since7d))
    ),
    ...LISTING_EVENT_TYPES.map((type) => count(supabase, "listing_events", (q) => q.eq("type", type))),
    ...LISTING_EVENT_TYPES.map((type) =>
      count(supabase, "listing_events", (q) => q.eq("type", type).gte("created_at", since7d))
    ),
  ]);

  let i = 0;
  const listingsByStatus = Object.fromEntries(LISTING_STATUSES.map((s) => [s, rest[i++]])) as Record<
    (typeof LISTING_STATUSES)[number],
    number
  >;
  const businessEventsTotal = Object.fromEntries(BUSINESS_EVENT_TYPES.map((t) => [t, rest[i++]])) as Record<
    (typeof BUSINESS_EVENT_TYPES)[number],
    number
  >;
  const businessEvents7d = Object.fromEntries(BUSINESS_EVENT_TYPES.map((t) => [t, rest[i++]])) as Record<
    (typeof BUSINESS_EVENT_TYPES)[number],
    number
  >;
  const listingEventsTotal = Object.fromEntries(LISTING_EVENT_TYPES.map((t) => [t, rest[i++]])) as Record<
    (typeof LISTING_EVENT_TYPES)[number],
    number
  >;
  const listingEvents7d = Object.fromEntries(LISTING_EVENT_TYPES.map((t) => [t, rest[i++]])) as Record<
    (typeof LISTING_EVENT_TYPES)[number],
    number
  >;

  return {
    users: { totalUsers, newUsers7d, communityMembers, admins, premiumActive },
    listings: { totalListings, newListings7d, byStatus: listingsByStatus },
    businessEvents: { total: businessEventsTotal, last7d: businessEvents7d },
    listingEvents: { total: listingEventsTotal, last7d: listingEvents7d },
  };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[12px] text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-[11.5px] text-muted mt-1">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

const LISTING_STATUS_LABELS: Record<(typeof LISTING_STATUSES)[number], string> = {
  pending: "En attente",
  approved: "En ligne",
  rejected: "Refusées",
  expired: "Expirées",
  sold: "Vendues",
};

const BUSINESS_EVENT_LABELS: Record<(typeof BUSINESS_EVENT_TYPES)[number], string> = {
  call: "Appels",
  website: "Site web",
  directions: "Itinéraire",
  whatsapp: "WhatsApp",
};

const LISTING_EVENT_LABELS: Record<(typeof LISTING_EVENT_TYPES)[number], string> = {
  view: "Vues",
  whatsapp: "WhatsApp",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-[420px] mx-auto px-4 pt-10 text-center flex flex-col items-center gap-3">
        <p className="font-serif text-lg font-semibold leading-tight">Connexion requise</p>
        <p className="text-[13px] text-muted leading-snug">
          Connecte-toi d&apos;abord, puis reviens sur ce lien pour accéder au dashboard.
        </p>
        <Link
          href="/mon-compte"
          className="h-[44px] px-5 rounded-xl bg-primary text-white text-[14px] font-semibold flex items-center justify-center active:scale-[.98] transition-transform"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

  if (!profile?.is_admin) {
    return (
      <div className="max-w-[420px] mx-auto px-4 pt-10 text-center">
        <p className="text-[13px] text-muted leading-snug">Accès réservé à l&apos;équipe Koté Moris.</p>
      </div>
    );
  }

  const stats = await loadStats();

  return (
    <div className="min-h-screen bg-bg text-ink p-6 max-w-3xl mx-auto">
      <Link href="/admin" className="text-sm text-primary underline underline-offset-2 mb-4 inline-block">
        ← Admin
      </Link>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <Section title="Inscriptions">
        <StatCard label="Comptes créés" value={stats.users.totalUsers} sub={`+${stats.users.newUsers7d} sur 7 jours`} />
        <StatCard label="Membres communauté" value={stats.users.communityMembers} />
        <StatCard label="Admins" value={stats.users.admins} />
        <StatCard label="Premium actifs" value={stats.users.premiumActive} />
      </Section>

      <Section title="Annonces seconde main">
        <StatCard
          label="Total"
          value={stats.listings.totalListings}
          sub={`+${stats.listings.newListings7d} sur 7 jours`}
        />
        {LISTING_STATUSES.map((status) => (
          <StatCard key={status} label={LISTING_STATUS_LABELS[status]} value={stats.listings.byStatus[status]} />
        ))}
      </Section>

      <Section title="Flux — actions sur les fiches">
        {BUSINESS_EVENT_TYPES.map((type) => (
          <StatCard
            key={type}
            label={BUSINESS_EVENT_LABELS[type]}
            value={stats.businessEvents.total[type]}
            sub={`+${stats.businessEvents.last7d[type]} sur 7 jours`}
          />
        ))}
      </Section>

      <Section title="Flux — actions sur les annonces">
        {LISTING_EVENT_TYPES.map((type) => (
          <StatCard
            key={type}
            label={LISTING_EVENT_LABELS[type]}
            value={stats.listingEvents.total[type]}
            sub={`+${stats.listingEvents.last7d[type]} sur 7 jours`}
          />
        ))}
      </Section>
    </div>
  );
}
