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

-- Append-only log fed by lib/track.ts's trackEvent() via /api/track. Aggregate with
-- `select type, count(*) from business_events where business_id = $1 group by type`
-- to produce the stats pitch ("3200 vues, 180 clics WhatsApp, 42 itinéraires").
-- Pas de FK vers businesses (id) : les fiches vivent dans data/businesses.json, pas
-- dans cette table (toujours vide) tant que la bascule vers Supabase n'a pas eu lieu.
create table business_events (
  id bigint generated always as identity primary key,
  business_id text not null,
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
  is_community_member boolean not null default false,
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

-- Alertes email : l'utilisateur enregistre des critères (annonces seconde main
-- ou événements de l'agenda), le cron quotidien api/cron/send-alerts compare
-- aux nouveautés et envoie un email s'il y a une correspondance.
-- criteria (jsonb) selon type :
--   listing : { category?, zone?, maxPrice?, keyword? }
--   event   : { themes?: string[], filters?: string[], keyword? }
-- notified_ids : IDs déjà notifiés pour ce type "event" (les fiches agenda de
-- data/businesses.json n'ont pas de created_at fiable, donc la détection de
-- nouveauté se fait par diff d'IDs plutôt que par date).
create table saved_searches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('listing', 'event')),
  label text not null,
  criteria jsonb not null default '{}'::jsonb,
  notified_ids jsonb not null default '[]'::jsonb,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index saved_searches_user_id_idx on saved_searches (user_id);

alter table profiles enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table saved_searches enable row level security;

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

-- saved_searches : chacun gère ses propres alertes (pas d'update : on supprime
-- et recrée plutôt que de modifier des critères existants).
create policy "saved_searches: owner read own" on saved_searches for select using (auth.uid() = user_id);
create policy "saved_searches: owner insert" on saved_searches for insert with check (auth.uid() = user_id);
create policy "saved_searches: owner delete own" on saved_searches for delete using (auth.uid() = user_id);

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
grant select, insert, delete on saved_searches to authenticated;

grant all on businesses, business_claims, business_events to service_role;
grant all on profiles, listings, listing_photos, listing_events to service_role;
grant all on saved_searches to service_role;

-- Sauvegarde automatique des favoris (cœur/à tester/testé + sélections KM mises
-- en favori) pour tout utilisateur connecté, en complément du localStorage qui
-- reste la seule source pour les visiteurs non connectés. Un blob JSON par
-- utilisateur : même forme que le stockage local (pas de nouvelle normalisation),
-- cf. lib/favorites.ts et lib/favoriteSelections.ts.
create table user_favorites (
  user_id uuid primary key references auth.users (id),
  statuses jsonb not null default '{}'::jsonb,
  selection_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_favorites enable row level security;
create policy "user_favorites: self read" on user_favorites for select using (auth.uid() = user_id);
create policy "user_favorites: self insert" on user_favorites for insert with check (auth.uid() = user_id);
create policy "user_favorites: self update" on user_favorites for update using (auth.uid() = user_id);

grant select, insert, update on user_favorites to authenticated;
grant all on user_favorites to service_role;

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

-- Bucket "listing-photos" (public en lecture) : la lecture publique bypass RLS
-- (bucket public), mais l'écriture reste soumise à RLS sur storage.objects
-- (activé par défaut sur tout projet Supabase). Sans ces policies, l'upload
-- échoue silencieusement côté client (l'API renvoie 500, mais le formulaire
-- ne bloquait pas la suite du dépôt d'annonce dessus).
-- Chemin attendu : {user_id}/{listing_id}/{timestamp}.{ext} → seul le
-- 1er segment (dossier) sert à vérifier la propriété.
create policy "listing_photos storage: owner insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "listing_photos storage: owner delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Photo de profil éditable (« Mon compte ») : même principe que listing-photos
-- ci-dessus. Le bucket "avatars" (public en lecture) doit être créé à la main
-- dans le dashboard Supabase (Storage → New bucket → "avatars", public) : ce
-- fichier ne crée que la colonne et les policies, pas le bucket lui-même.
alter table profiles add column avatar_url text;

create policy "avatars storage: owner insert" on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars storage: owner update" on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars storage: owner delete" on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Sécurité : la policy RLS "listings: owner update own" ne restreint que les
-- LIGNES (auth.uid() = user_id), pas les colonnes — un propriétaire pouvait
-- donc en théorie appeler l'API Supabase directement pour passer sa propre
-- annonce en status='approved' (auto-approbation, contournement de la
-- modération et de la limite de 10 annonces actives), ou même l'insérer déjà
-- approuvée dès le départ. On restreint donc au niveau colonne : un
-- utilisateur authentifié ne peut insérer/modifier que le contenu de son
-- annonce (titre, description, prix, catégorie, whatsapp, zone) — jamais
-- status/approved_at/expires_at/rejection_reason, qui ne transitent que par
-- les routes serveur (clé service-role : approbation admin, renouvellement).
revoke insert, update on listings from authenticated;
grant insert (user_id, title, description, price, category, whatsapp, zone) on listings to authenticated;
grant update (title, description, price, category, whatsapp, zone) on listings to authenticated;

-- Listes de favoris nommées (premium) : une fiche peut appartenir à plusieurs
-- listes, en plus du statut favori/à tester/testé existant (lib/favorites.ts,
-- inchangé). business_ids référence data/businesses.json (pas de FK possible :
-- ces fiches ne vivent pas dans Supabase). share_token, quand non-null, rend
-- la liste consultable via app/liste/[token] — mais uniquement via une route
-- serveur utilisant la clé service-role (app/liste/[token]/page.tsx) : aucun
-- grant anon n'est accordé ici, pour empêcher qu'on énumère toutes les listes
-- partagées en interrogeant la table REST directement.
create table favorite_lists (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  business_ids text[] not null default '{}',
  share_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index favorite_lists_user_id_idx on favorite_lists (user_id);
create unique index favorite_lists_share_token_idx on favorite_lists (share_token) where share_token is not null;

alter table favorite_lists enable row level security;
create policy "favorite_lists: owner all" on favorite_lists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on favorite_lists to authenticated;
grant all on favorite_lists to service_role;

-- Rappel J-7 pour les alertes événements : en plus de l'email à la création
-- de la fiche, un second email relance quand l'événement est à 7 jours ou
-- moins (date exacte connue uniquement). reminded_ids suit les IDs déjà
-- rappelés, séparément de notified_ids (création), pour ne jamais doubler.
alter table saved_searches add column reminded_ids jsonb not null default '[]'::jsonb;

-- Suivi global (pas par utilisateur) des fiches annuaire déjà notifiées par le
-- cron notify-new-businesses, pour ne jamais renvoyer deux fois le même e-mail
-- de "nouvelle adresse" aux comptes premium.
create table notified_businesses (
  business_id text primary key,
  notified_at timestamptz not null default now()
);

alter table notified_businesses enable row level security;
grant all on notified_businesses to service_role;

-- Suivi de l'e-mail de bienvenue envoyé à la toute première connexion
-- (app/auth/callback/route.ts) : évite de le renvoyer aux connexions suivantes.
alter table profiles add column welcome_email_sent_at timestamptz;
