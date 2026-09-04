-- Maurice+ — schema for the monetization model described in APPLI MODELE ECO.docx.
-- Not run yet: no Supabase project exists. Ready to paste in once credentials are created;
-- lib/data.ts still reads data/businesses.json until this is wired up.

create table businesses (
  id text primary key,
  name text not null,
  category text not null,
  address text not null,
  phone text,
  website text,
  google_maps_url text,
  lat double precision not null,
  lng double precision not null,
  themes text[],
  tier text not null default 'free' check (tier in ('free', 'premium')),
  claimed boolean not null default false,
  badge text check (badge in ('partenaire')),
  whatsapp text,
  promo_text text,
  created_at timestamptz not null default now()
);

-- One row per pro asking to take ownership of a fiche; approval flips businesses.claimed.
create table business_claims (
  id bigint generated always as identity primary key,
  business_id text not null references businesses (id),
  user_id uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Append-only log fed by lib/track.ts's trackEvent(). Aggregate with
-- `select type, count(*) from business_events where business_id = $1 group by type`
-- to produce the stats pitch ("3200 vues, 180 clics WhatsApp, 42 itinéraires").
create table business_events (
  id bigint generated always as identity primary key,
  business_id text not null references businesses (id),
  type text not null check (type in ('call', 'website', 'directions', 'whatsapp')),
  created_at timestamptz not null default now()
);

create index business_events_business_id_idx on business_events (business_id);
create index business_claims_business_id_idx on business_claims (business_id);

-- Marketplace "Seconde main entre particuliers" — annonces déposées par des
-- utilisateurs premium (auth.users), validées par l'admin avant publication.

-- Extension de auth.users avec l'état applicatif + l'abonnement Stripe.
create table profiles (
  id uuid primary key references auth.users (id),
  display_name text,
  phone text,
  is_admin boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'none'
    check (subscription_status in ('active', 'past_due', 'canceled', 'none')),
  premium_until timestamptz,
  created_at timestamptz not null default now()
);

create table listings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id),
  title text not null,
  description text,
  price numeric,
  category text not null,
  whatsapp text not null,
  zone text check (zone in ('nord', 'sud', 'est', 'ouest', 'centre')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired', 'sold')),
  rejection_reason text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table listing_photos (
  id bigint generated always as identity primary key,
  listing_id bigint not null references listings (id) on delete cascade,
  storage_path text not null,
  position int not null default 0
);

-- Append-only, même principe que business_events : vues + clics WhatsApp par annonce.
create table listing_events (
  id bigint generated always as identity primary key,
  listing_id bigint not null references listings (id),
  type text not null check (type in ('view', 'whatsapp')),
  created_at timestamptz not null default now()
);

create index listings_user_id_idx on listings (user_id);
create index listings_status_idx on listings (status);
create index listings_expires_at_idx on listings (expires_at) where status = 'approved';
create index listing_photos_listing_id_idx on listing_photos (listing_id);
create index listing_events_listing_id_idx on listing_events (listing_id);

alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;

-- profiles : chacun lit/écrit sa propre ligne (colonnes sensibles comme
-- is_admin/subscription_status ne sont modifiées que par des routes serveur
-- utilisant la clé service-role, qui bypass RLS).
create policy "profiles: self read" on profiles for select using (auth.uid() = id);
create policy "profiles: self update" on profiles for update using (auth.uid() = id);
create policy "profiles: self insert" on profiles for insert with check (auth.uid() = id);

-- listings : le public voit les annonces approuvées, chacun gère les siennes.
create policy "listings: public read approved" on listings for select using (status = 'approved');
create policy "listings: owner read own" on listings for select using (auth.uid() = user_id);
create policy "listings: owner insert" on listings for insert with check (auth.uid() = user_id);
create policy "listings: owner update own" on listings for update using (auth.uid() = user_id);

create policy "listing_photos: public read of approved listings" on listing_photos for select
  using (exists (select 1 from listings l where l.id = listing_id and l.status = 'approved'));
create policy "listing_photos: owner manage" on listing_photos for all
  using (exists (select 1 from listings l where l.id = listing_id and l.user_id = auth.uid()));

-- "Automatically expose new tables" est désactivé sur ce projet (contrôle
-- d'accès manuel, recommandé par Supabase) : les rôles de la Data API n'ont
-- donc aucun droit par défaut sur les tables ci-dessus tant qu'on ne le leur
-- accorde pas explicitement. RLS restreint ensuite les LIGNES visibles/écrites ;
-- ces GRANT ne font qu'autoriser l'accès à la TABLE elle-même.
grant usage on schema public to anon, authenticated, service_role;

grant select on businesses to anon, authenticated;
grant select, insert, update on business_claims to authenticated;
grant select, insert on business_events to anon, authenticated;

grant select, update, insert on profiles to authenticated;
grant select, insert, update on listings to authenticated;
grant select on listings to anon;
grant select, insert, update, delete on listing_photos to authenticated;
grant select on listing_photos to anon;
grant select, insert on listing_events to anon, authenticated;

grant all on businesses, business_claims, business_events to service_role;
grant all on profiles, listings, listing_photos, listing_events to service_role;

-- Crée automatiquement la ligne profiles correspondante à chaque nouvel
-- utilisateur Supabase Auth (sinon rien ne le fait : la policy d'insert sur
-- profiles n'autorise que l'utilisateur lui-même, jamais un premier login).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
