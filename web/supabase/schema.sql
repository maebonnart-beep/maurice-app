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
