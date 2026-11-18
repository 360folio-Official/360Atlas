-- 360atlas initial schema. Run in the Supabase SQL editor or with `supabase db push`.

create extension if not exists postgis;
create extension if not exists pg_trgm;

create type member_type as enum ('provider', 'owner');
create type plan_tier as enum ('free', 'pro', 'business');
create type listing_status as enum ('pending', 'live', 'broken_link', 'hidden');

-- Categories -----------------------------------------------------------------

create table categories (
  slug text primary key,
  icon text not null default '',
  sort_order int not null default 0
);

create table category_translations (
  category_slug text not null references categories (slug) on delete cascade,
  locale text not null,
  name text not null,
  primary key (category_slug, locale)
);

-- Members --------------------------------------------------------------------
-- One row per business profile. `user_id` is null for profiles seeded by the
-- admin that nobody has claimed yet.

create table members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  slug text not null unique,
  type member_type not null default 'provider',
  business_name text not null,
  contact_name text,
  bio text,
  website_url text,
  logo_path text,
  languages text[] not null default '{}',
  platforms text[] not null default '{}',
  verified boolean not null default false,
  plan plan_tier not null default 'free',
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Where a member operates: a point plus a radius.
create table service_areas (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  label text not null,
  city text,
  country text,
  location geography (point, 4326) not null,
  radius_km int not null default 50 check (radius_km between 1 and 2000)
);

create index service_areas_location_idx on service_areas using gist (location);
create index service_areas_member_idx on service_areas (member_id);

-- Listings -------------------------------------------------------------------

create table listings (
  id bigint generated always as identity primary key,
  slug text not null unique,
  member_id uuid references members (id) on delete set null,
  -- The provider who shot the tour, when an owner lists it.
  credited_provider_id uuid references members (id) on delete set null,
  title text not null,
  category_slug text not null references categories (slug),
  tour_url text not null,
  platform text not null,
  thumbnail_path text,
  -- Null location = virtual-only tour, kept off the map.
  location geography (point, 4326),
  address text,
  city text,
  country text,
  website_url text,
  booking_url text,
  status listing_status not null default 'pending',
  featured_until timestamptz,
  seeded boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index listings_tour_url_idx on listings (lower(tour_url));
create index listings_location_idx on listings using gist (location);
create index listings_category_idx on listings (category_slug) where status = 'live';
create index listings_member_idx on listings (member_id);
create index listings_title_trgm_idx on listings using gin (title gin_trgm_ops);

-- Enquiries and click tracking -------------------------------------------------

create table enquiries (
  id bigint generated always as identity primary key,
  member_id uuid not null references members (id) on delete cascade,
  listing_id bigint references listings (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index enquiries_member_idx on enquiries (member_id, created_at desc);

create table click_events (
  id bigint generated always as identity primary key,
  listing_id bigint not null references listings (id) on delete cascade,
  kind text not null check (kind in ('view', 'tour_open', 'website', 'booking')),
  locale text,
  created_at timestamptz not null default now()
);

create index click_events_listing_idx on click_events (listing_id, created_at desc);

-- Subscriptions (mirrored from Stripe webhooks) --------------------------------

create table subscriptions (
  member_id uuid primary key references members (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  plan plan_tier not null default 'free',
  status text not null,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Map and near-me queries ------------------------------------------------------

create or replace function listings_in_bounds (
  min_lng float8, min_lat float8, max_lng float8, max_lat float8,
  category text default null
)
returns setof listings
language sql stable
as $$
  select *
  from listings
  where status = 'live'
    and location is not null
    and location && st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (category is null or category_slug = category);
$$;

create or replace function providers_near (lng float8, lat float8)
returns setof members
language sql stable
as $$
  select distinct m.*
  from members m
  join service_areas a on a.member_id = m.id
  where m.type = 'provider'
    and st_dwithin(a.location, st_point(lng, lat, 4326)::geography, a.radius_km * 1000);
$$;

-- Row level security -----------------------------------------------------------

alter table categories enable row level security;
alter table category_translations enable row level security;
alter table members enable row level security;
alter table service_areas enable row level security;
alter table listings enable row level security;
alter table enquiries enable row level security;
alter table click_events enable row level security;
alter table subscriptions enable row level security;

create policy "categories are public" on categories for select using (true);
create policy "category names are public" on category_translations for select using (true);

create policy "members are public" on members for select using (true);
create policy "members edit own profile" on members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users create own profile" on members for insert
  with check (user_id = auth.uid());

create policy "service areas are public" on service_areas for select using (true);
create policy "members manage own areas" on service_areas for all
  using (member_id in (select id from members where user_id = auth.uid()))
  with check (member_id in (select id from members where user_id = auth.uid()));

create policy "live listings are public" on listings for select
  using (status = 'live' or member_id in (select id from members where user_id = auth.uid()));
create policy "members manage own listings" on listings for all
  using (member_id in (select id from members where user_id = auth.uid()))
  with check (member_id in (select id from members where user_id = auth.uid()));

create policy "anyone can send an enquiry" on enquiries for insert with check (true);
create policy "members read own enquiries" on enquiries for select
  using (member_id in (select id from members where user_id = auth.uid()));

create policy "members read own subscription" on subscriptions for select
  using (member_id in (select id from members where user_id = auth.uid()));

-- click_events has no policies: only the service role (server) reads and writes it.
-- Plan, verified and featured_until must only be changed by the server; add a
-- trigger or column privileges for that before opening sign-ups.
