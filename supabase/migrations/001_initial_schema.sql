-- =============================================================================
-- INDIEPORT / Supabase initial schema
-- File: supabase/migrations/001_initial_schema.sql
--
-- Purpose:
--   - Create core tables for games, users, likes, comments, follows,
--     collections, reviews and supporting lookup/join tables.
--   - Enable and complete RLS for every table and Storage object.
--   - Auto-create public.profiles on auth.users insert.
--   - Maintain aggregate counters with SECURITY DEFINER triggers.
--   - Protect sensitive game columns with column-level privileges.
--   - Seed lookup data and provide an optional demo-game seed function.
--
-- Notes:
--   - Runs in a single transaction; any error rolls back the whole migration.
--   - Re-running is safe for objects created by this file (policies/triggers
--     are dropped and recreated, seeds use ON CONFLICT).
--   - Structural drift from a previous partial run requires a new migration.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Extensions and schemas
-- -----------------------------------------------------------------------------
create schema if not exists extensions;
create schema if not exists private;

-- private schema holds SECURITY DEFINER helpers and is not exposed by PostgREST.
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  bio text,
  follower_count integer not null default 0 check (follower_count >= 0),
  following_count integer not null default 0 check (following_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.genres (
  id text primary key,
  label text not null,
  icon text not null,
  sort_order integer not null default 0
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique check (char_length(label) between 1 and 40)
);

create table if not exists public.platforms (
  id text primary key
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,98}$'),
  author_id uuid not null references public.profiles(id) on delete restrict,
  genre text not null references public.genres(id),
  title text not null check (char_length(title) between 1 and 200),
  tagline text not null default '',
  description text not null default '',
  about text not null default '',
  features text[] not null default '{}',
  -- `all` is a UI-only filter and is intentionally NOT stored in genres.
  art_style text not null check (art_style in (
    'space', 'neon', 'rain', 'forest', 'geometric', 'horror',
    'tower', 'pixel', 'fireworks', 'ocean', 'city'
  )),
  palette text[] not null check (array_length(palette, 1) = 2),
  accent text not null check (accent ~ '^#[0-9A-Fa-f]{6}$'),
  cover_path text,
  price integer not null default 0 check (price >= 0),
  release_date date not null,
  play_minutes integer not null default 0 check (play_minutes >= 0),
  downloads integer not null default 0 check (downloads >= 0),
  rating_avg numeric(3,2) not null default 0 check (rating_avg between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  featured boolean not null default false,
  trending boolean not null default false,
  is_new boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_tags (
  game_id uuid not null references public.games(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (game_id, tag_id)
);

create table if not exists public.game_platforms (
  game_id uuid not null references public.games(id) on delete cascade,
  platform_id text not null references public.platforms(id) on delete cascade,
  primary key (game_id, platform_id)
);

create table if not exists public.game_screenshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.game_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9_-]{1,60}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  note text,
  added_at timestamptz not null default now(),
  primary key (collection_id, game_id)
);

-- -----------------------------------------------------------------------------
-- 1b. Indexes
-- -----------------------------------------------------------------------------
-- Listing queries filter by published status, then order by release date,
-- popularity or rating. Partial indexes keep the common path small.
create index if not exists games_published_release_idx
  on public.games (published_at desc, release_date desc)
  where status = 'published';

create index if not exists games_popular_idx
  on public.games (downloads desc, like_count desc)
  where status = 'published';

create index if not exists games_rating_idx
  on public.games (rating_avg desc, review_count desc)
  where status = 'published';

create index if not exists games_genre_idx
  on public.games (genre)
  where status = 'published';

create index if not exists games_author_idx
  on public.games (author_id, created_at desc);

-- pg_trgm is installed into the `extensions` schema above. Detect the operator
-- class location so this migration also works if the extension already exists
-- in a different schema on the target project.
do $$
declare
  v_opclass text;
begin
  select format('%I.%I', n.nspname, o.opcname)
    into v_opclass
  from pg_catalog.pg_opclass o
  join pg_catalog.pg_namespace n on n.oid = o.opcnamespace
  where o.opcname = 'gin_trgm_ops'
  limit 1;

  if v_opclass is not null then
    execute format(
      'create index if not exists games_search_trgm on public.games using gin (search_text %s)',
      v_opclass
    );
  end if;
end $$;

-- Reverse-direction lookup indexes (the primary keys already cover the other
-- direction in the join tables).
create index if not exists game_tags_tag_idx
  on public.game_tags (tag_id, game_id);

create index if not exists comments_game_idx
  on public.comments (game_id, created_at desc);

create index if not exists comments_parent_idx
  on public.comments (parent_id);

create index if not exists reviews_game_idx
  on public.reviews (game_id, created_at desc);

create index if not exists game_likes_game_idx
  on public.game_likes (game_id);

create index if not exists follows_following_idx
  on public.follows (following_id);

create index if not exists collections_user_idx
  on public.collections (user_id, created_at desc);

create index if not exists collection_items_game_idx
  on public.collection_items (game_id);

-- -----------------------------------------------------------------------------
-- 2. Helper functions (SECURITY DEFINER, pinned search_path)
-- -----------------------------------------------------------------------------

-- Safely cast the first Storage folder segment to uuid.
create or replace function private.path_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_value is null then
    return null;
  end if;
  if p_value ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return p_value::uuid;
  end if;
  return null;
exception when others then
  return null;
end;
$$;

create or replace function private.is_game_owner(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games g
    where g.id = p_game_id
      and g.author_id = auth.uid()
  );
$$;

create or replace function private.is_game_published(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games g
    where g.id = p_game_id
      and g.status = 'published'
  );
$$;

-- Prevent authors from rating/reviewing their own games.
create or replace function private.can_review_game(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games g
    where g.id = p_game_id
      and g.status = 'published'
      and g.author_id <> auth.uid()
  );
$$;

-- Owners can read their own assets in ANY status (including drafts).
-- Everyone else can read only free, published games. Paid games require a
-- service_role signed URL, which is not implemented in this migration.
create or replace function private.can_read_game_asset(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.games g
    where g.id = p_game_id
      and (
        g.author_id = auth.uid()
        or (g.status = 'published' and g.price = 0)
      )
  );
$$;

create or replace function private.is_collection_owner(p_collection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.collections c
    where c.id = p_collection_id
      and c.user_id = auth.uid()
  );
$$;

-- Rebuild search_text for one game. SECURITY DEFINER is required because
-- `games.search_text` is not writable by the authenticated role.
create or replace function private.refresh_game_search_text(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.games g
     set search_text = lower(coalesce(concat_ws(' ',
           g.title,
           g.tagline,
           g.description,
           p.display_name,
           p.handle,
           gn.label,
           (
             select string_agg(t.label, ' ' order by t.label)
             from public.game_tags gt
             join public.tags t on t.id = gt.tag_id
             where gt.game_id = g.id
           )
         ), ''))
    from public.profiles p
    join public.genres gn on gn.id = g.genre
   where g.id = p_game_id
     and p.id = g.author_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Trigger functions
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A reply must belong to the same game as its parent. This is enforced in the
-- database so it cannot be bypassed by a client that omits the check.
create or replace function public.validate_comment_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_game uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'A comment cannot be its own parent';
  end if;

  select c.game_id
    into v_parent_game
    from public.comments c
   where c.id = new.parent_id;

  if not found then
    raise exception 'Parent comment does not exist';
  end if;

  if v_parent_game is distinct from new.game_id then
    raise exception 'Parent comment belongs to a different game';
  end if;

  return new;
end;
$$;

-- Sets author_id and published_at only. search_text is rebuilt by an AFTER
-- trigger (see refresh_game_search_text_after) so that tag changes and direct
-- search_text refreshes are never overwritten by this BEFORE trigger.
-- Sensitive columns (downloads/rating_avg/like_count/featured/...) are untouched.
create or replace function public.set_game_derived_values()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  elsif new.status <> 'published' then
    new.published_at := null;
  end if;

  return new;
end;
$$;

-- Rebuild search_text after a game row is inserted or when its searchable
-- source columns change. SECURITY DEFINER is needed because `search_text` is
-- not writable by authenticated and private.refresh_game_search_text() is
-- service_role-only. The guard prevents recursion when the refresh helper
-- itself updates only `search_text`.
create or replace function public.refresh_game_search_text_after()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.refresh_game_search_text(new.id);
    return null;
  end if;

  if new.title is distinct from old.title
     or new.tagline is distinct from old.tagline
     or new.description is distinct from old.description
     or new.genre is distinct from old.genre
     or new.author_id is distinct from old.author_id
  then
    perform private.refresh_game_search_text(new.id);
  end if;

  return null;
end;
$$;

-- Auto-create a profile on signup. All metadata values are sanitised so that
-- malformed/oversized OAuth metadata cannot violate profiles constraints.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
  v_candidate text;
  v_display text;
  v_avatar text;
  v_suffix integer := 0;
  v_attempt integer := 0;
begin
  v_base := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'handle'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'user_name'), ''),
    nullif(btrim(split_part(new.email, '@', 1)), ''),
    'user'
  );

  -- Keep only characters allowed by the handle check constraint.
  v_base := regexp_replace(lower(v_base), '[^a-z0-9_]', '', 'g');
  if char_length(v_base) < 3 then
    v_base := 'user' || v_base;
  end if;
  v_base := left(v_base, 24);

  v_candidate := v_base;
  while exists (select 1 from public.profiles p where p.handle = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := left(v_base, greatest(1, 24 - length(v_suffix::text))) || v_suffix::text;
  end loop;

  -- display_name must be 1..80 characters and must not be blank.
  v_display := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(new.email, '@', 1)), ''),
    'Creator'
  );
  v_display := left(v_display, 80);
  if btrim(v_display) = '' then
    v_display := 'Creator';
  end if;

  v_avatar := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '');

  -- Retry on a concurrent handle collision (the unique constraint can still
  -- fire between the EXISTS check and the INSERT).
  loop
    begin
      insert into public.profiles (id, handle, display_name, avatar_url)
      values (new.id, v_candidate, v_display, v_avatar)
      on conflict (id) do nothing;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 50 then
        raise;
      end if;
      v_candidate := left('u' || replace(new.id::text, '-', ''), 20)
                     || v_attempt::text;
    end;
  end loop;

  return new;
end;
$$;

create or replace function public.refresh_game_search_text_from_tags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.refresh_game_search_text(new.game_id);
  elsif tg_op = 'DELETE' then
    perform private.refresh_game_search_text(old.game_id);
  else
    -- A row moved to another game: refresh both the old and the new game.
    if old.game_id is distinct from new.game_id then
      perform private.refresh_game_search_text(old.game_id);
    end if;
    perform private.refresh_game_search_text(new.game_id);
  end if;
  return null;
end;
$$;

-- Used by profiles/genres/tags updates: rebuild all search documents.
create or replace function public.refresh_all_game_search_text()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in select id from public.games loop
    perform private.refresh_game_search_text(r.id);
  end loop;
  return null;
end;
$$;

create or replace function private.sync_game_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  if tg_op = 'DELETE' then
    v_target := old.game_id;
  else
    v_target := new.game_id;
  end if;

  update public.games g
     set like_count = (
       select count(*) from public.game_likes l where l.game_id = v_target
     )
   where g.id = v_target;

  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    update public.games g
       set like_count = (
         select count(*) from public.game_likes l where l.game_id = old.game_id
       )
     where g.id = old.game_id;
  end if;

  return null;
end;
$$;

create or replace function private.sync_review_stats()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  if tg_op = 'DELETE' then
    v_target := old.game_id;
  else
    v_target := new.game_id;
  end if;

  update public.games g
     set rating_avg = coalesce((
           select round(avg(r.rating)::numeric, 2)
           from public.reviews r
           where r.game_id = v_target
         ), 0),
         review_count = (
           select count(*) from public.reviews r where r.game_id = v_target
         )
   where g.id = v_target;

  if tg_op = 'UPDATE' and old.game_id is distinct from new.game_id then
    update public.games g
       set rating_avg = coalesce((
             select round(avg(r.rating)::numeric, 2)
             from public.reviews r
             where r.game_id = old.game_id
           ), 0),
           review_count = (
             select count(*) from public.reviews r where r.game_id = old.game_id
           )
     where g.id = old.game_id;
  end if;

  return null;
end;
$$;

create or replace function private.sync_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_follower uuid;
  v_following uuid;
begin
  if tg_op = 'DELETE' then
    v_follower := old.follower_id;
    v_following := old.following_id;
  else
    v_follower := new.follower_id;
    v_following := new.following_id;
  end if;

  update public.profiles p
     set following_count = (
       select count(*) from public.follows f where f.follower_id = v_follower
     )
   where p.id = v_follower;

  update public.profiles p
     set follower_count = (
       select count(*) from public.follows f where f.following_id = v_following
     )
   where p.id = v_following;

  if tg_op = 'UPDATE' then
    if old.follower_id is distinct from new.follower_id then
      update public.profiles p
         set following_count = (
           select count(*) from public.follows f where f.follower_id = old.follower_id
         )
       where p.id = old.follower_id;
    end if;

    if old.following_id is distinct from new.following_id then
      update public.profiles p
         set follower_count = (
           select count(*) from public.follows f where f.following_id = old.following_id
         )
       where p.id = old.following_id;
    end if;
  end if;

  return null;
end;
$$;

-- Trusted RPC for download increments. Not callable by anon/authenticated.
create or replace function public.increment_game_downloads(
  p_game_id uuid,
  p_amount integer default 1
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_amount is null or p_amount <= 0 or p_amount > 100 then
    raise exception 'Invalid download increment amount';
  end if;

  update public.games g
     set downloads = g.downloads + p_amount
   where g.id = p_game_id
     and g.status = 'published';

  if not found then
    raise exception 'Game not found or not published';
  end if;
end;
$$;

-- Optional demo data seeder. Requires an existing auth user + profile.
create or replace function private.seed_demo_games(p_author_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  drop table if exists pg_temp.demo_games;

  create temp table pg_temp.demo_games
  on commit drop
  as
  select *
  from jsonb_to_recordset($demo$[
    {
      "slug": "hoshikuzu-requiem",
      "title": "星屑のレクイエム",
      "tagline": "失われた星を巡る、静かな宇宙の旅",
      "genre": "rpg",
      "tags": ["SF", "ストーリー重視", "ターン制"],
      "description": "消えゆく星々を巡り、記憶のかけらを集める宇宙RPG。壮大な景色と静かな音色が、旅の終わりに待つ答えを彩ります。",
      "about": "銀河の果てで星がひとつずつ消えていく。あなたは星々の記憶を記録する「星読み」として、衰えゆく宇宙を旅します。戦闘はターン制。敵を倒すのではなく、記憶を「読む」ことで物語が進みます。10時間以上のボリュームと、複数のエンディングを収録。",
      "features": ["手描き風の美麗なドット絵", "記憶を読み解く独自バトル", "5つのエンディング", "オリジナルサウンドトラック"],
      "rating_avg": 4.8,
      "review_count": 412,
      "downloads": 24800,
      "price": 1200,
      "release_date": "2026-10-14",
      "platforms": ["Windows", "macOS", "Linux"],
      "art_style": "space",
      "palette": ["#1b1d4a", "#4b2b7d"],
      "accent": "#ffd166",
      "featured": true,
      "trending": true,
      "is_new": false,
      "play_minutes": 600
    },
    {
      "slug": "neon-drift-2088",
      "title": "NEON DRIFT 2088",
      "tagline": "夜を駆け抜けろ。ネオンの速度で。",
      "genre": "action",
      "tags": ["レーシング", "レトロ", "高速"],
      "description": "ネオンに染まる未来都市を舞台にした高速レーシング。ドリフトを決めるたびにスコアが跳ね上がります。",
      "about": "2088年、夜の街路は光の川になった。愛車をチューニングし、8つのコースを走り抜けろ。爽快なドリフトと全力の加速、そして耳を劈くシンセサウンド。タイムアタックモードでは世界中のランキングに挑戦できます。",
      "features": ["60FPSの高速ドライブ", "8つのコースと5台のマシン", "タイムアタック＆リプレイ", "11曲のオリジナルBGM"],
      "rating_avg": 4.6,
      "review_count": 289,
      "downloads": 41200,
      "price": 800,
      "release_date": "2026-09-28",
      "platforms": ["Windows", "macOS"],
      "art_style": "neon",
      "palette": ["#160b34", "#5b1a6b"],
      "accent": "#ff3d9a",
      "featured": true,
      "trending": true,
      "is_new": false,
      "play_minutes": 180
    },
    {
      "slug": "ame-no-kioku",
      "title": "雨の記憶",
      "tagline": "雨の日にだけ現れる、あの日のあなたへ",
      "genre": "story",
      "tags": ["青春", "エモーショナル", "短編"],
      "description": "梅雨の街を舞台にした、雨と記憶のビジュアルノベル。選択が織りなす、切なくも優しい物語。",
      "about": "6月のある日、傘の忘れ物をしたあなたは、見知らぬ駅で雨に降られる。そこで出会ったのは、槙野さん。雨が止むまで、2人は屋根の下で言葉を交わします。選択肢によって少しずつ変わる会話と、3つの結末。雨音とピアノの旋律が、あなたの記憶にそっと触れます。",
      "features": ["約2時間の読み応え", "3つのエンディング", "雨音を再現した臨場サウンド", "全イラスト描き下ろし"],
      "rating_avg": 4.9,
      "review_count": 621,
      "downloads": 58700,
      "price": 0,
      "release_date": "2026-11-02",
      "platforms": ["Windows", "macOS", "Linux", "Web"],
      "art_style": "rain",
      "palette": ["#13293d", "#2b5b7c"],
      "accent": "#7dd3fc",
      "featured": true,
      "trending": true,
      "is_new": true,
      "play_minutes": 120
    },
    {
      "slug": "mori-no-sasayaki",
      "title": "森のささやき",
      "tagline": "森が語りかける、小さな冒険のはじまり",
      "genre": "adventure",
      "tags": ["癒し", "探索", "ほのぼの"],
      "description": "木々に導かれるままに森を歩く、のんびり探索アドベンチャー。小さな生きものたちとの出会いが待っています。",
      "about": "森の奥に、小さな灯りが灯る。あなたは迷い込んだ森の奥で、言葉を話す動物たちと出会います。彼らはあなたが家に帰る手助けをしてくれる — もしあなたが望むなら。のんびりとした時間と、手描きの温かい絵本のような世界。",
      "features": ["自由に歩ける広大な森", "生きもの図鑑の収集要素", "昼夜で変わる景色", "子どもから大人まで楽しめる"],
      "rating_avg": 4.5,
      "review_count": 198,
      "downloads": 18300,
      "price": 500,
      "release_date": "2026-10-30",
      "platforms": ["Windows", "macOS"],
      "art_style": "forest",
      "palette": ["#123028", "#2e6b4f"],
      "accent": "#a3e635",
      "featured": false,
      "trending": false,
      "is_new": true,
      "play_minutes": 240
    },
    {
      "slug": "cube-shift",
      "title": "CUBE SHIFT",
      "tagline": "ひとつずつずらして、答えにたどり着け",
      "genre": "puzzle",
      "tags": ["パズル", "ミニマル", "頭脳"],
      "description": "積み木をスライドさせて、決められた形を作るミニマルパズル。考えれば考えるほど、奥が深い。",
      "about": "ルールはひとつ。ブロックを動かして、お題の形を作るだけ。それなのに、120のステージはすべてが新しい悩みを投げかけます。失敗してもすぐにやり直せるので、気軽に頭を悩ませられます。通勤時間のひと時にぴったり。",
      "features": ["120のステージ", "ヒントシステム", "日替わりチャレンジ", "完全オフライン対応"],
      "rating_avg": 4.7,
      "review_count": 334,
      "downloads": 72300,
      "price": 0,
      "release_date": "2026-08-19",
      "platforms": ["Windows", "macOS", "Linux", "Web", "iOS", "Android"],
      "art_style": "geometric",
      "palette": ["#1a2a3a", "#34506b"],
      "accent": "#60a5fa",
      "featured": false,
      "trending": true,
      "is_new": false,
      "play_minutes": 300
    },
    {
      "slug": "shinya-convenience",
      "title": "深夜のコンビニ",
      "tagline": "午前3時、この店にいるのはあなただけではない。",
      "genre": "horror",
      "tags": ["ホラー", "心理", "短編"],
      "description": "深夜のコンビニで働くあなたの前に現れる、奇妙な客たち。生き残る方法は、品揃えを整えることだけ。",
      "about": "深夜シフトのコンビニに、奇妙な客がやってくる。彼らは何かを探している。あなたは店員として、彼らに「正しい商品」を渡さなければならない。間違えた瞬間、店の蛍光灯がちらつき始めます。40分、息の詰まる心理ホラー。",
      "features": ["VR対応（オプション）", "5つのエンディング", "ランダム発生するイベント", "ヘッドフォン推奨"],
      "rating_avg": 4.4,
      "review_count": 267,
      "downloads": 32900,
      "price": 600,
      "release_date": "2026-09-05",
      "platforms": ["Windows", "macOS"],
      "art_style": "horror",
      "palette": ["#101018", "#2e1f3a"],
      "accent": "#ef4444",
      "featured": false,
      "trending": true,
      "is_new": false,
      "play_minutes": 40
    },
    {
      "slug": "aoi-tower",
      "title": "蒼の塔",
      "tagline": "登りつめた先に、空がある。",
      "genre": "platformer",
      "tags": ["プラットフォーマー", "難易度調整可", "ピクセル"],
      "description": "空へと続く塔を登る、精密な操作が楽しいピクセルプラットフォーマー。手に汗握る連続ジャンプが快感。",
      "about": "雲の上にそびえる蒼い塔。そこには「無限の空」があると噂されています。100を超えるステージを、巨大な構造と難所が待ち受けます。死んでも即座に復活。何度でも挑戦できる設計で、クリアしたときの達成感はひとしおです。",
      "features": ["120ステージ＋ボスラッシュ", "アシストモード搭載", "スピードラン対応", "18曲のチップチューン"],
      "rating_avg": 4.6,
      "review_count": 178,
      "downloads": 15600,
      "price": 700,
      "release_date": "2026-11-10",
      "platforms": ["Windows", "macOS", "Linux", "Web"],
      "art_style": "tower",
      "palette": ["#112240", "#2f6f9e"],
      "accent": "#7dd3fc",
      "featured": false,
      "trending": false,
      "is_new": true,
      "play_minutes": 480
    },
    {
      "slug": "monochrome-garden",
      "title": "モノクロ・ガーデン",
      "tagline": "色を取り戻す、小さな庭の物語",
      "genre": "puzzle",
      "tags": ["パズル", "アート", "癒し"],
      "description": "白黒の庭に色を戻していく、詩的なパズルゲーム。光と影を組み合わせて、花を咲かせましょう。",
      "about": "色を失った庭に、たった一筋の光が差し込みました。鏡を動かして光を屈折させ、花々に色を取り戻していきます。絵本のような静けさと、考え込む楽しさ。すべてのステージを終えたとき、庭はどんな色になるのでしょうか。",
      "features": ["80の光のパズル", "季節ごとに変わる庭", "写真モード", "アンビエントサウンド"],
      "rating_avg": 4.7,
      "review_count": 143,
      "downloads": 12800,
      "price": 500,
      "release_date": "2026-07-22",
      "platforms": ["Windows", "macOS", "Web"],
      "art_style": "geometric",
      "palette": ["#2a2a35", "#555568"],
      "accent": "#fbbf24",
      "featured": false,
      "trending": false,
      "is_new": false,
      "play_minutes": 210
    },
    {
      "slug": "slime-farm",
      "title": "スライム農場",
      "tagline": "ぷにぷに経営、はじめました。",
      "genre": "simulation",
      "tags": ["経営", "ゆるい", "かわいい"],
      "description": "スライムを育てて、農場を大きくするほのぼの経営シミュレーション。放置しても、ちゃんと育ちます。",
      "about": "小さな農場を借りて、スライムの飼育を始めました。餌をやればミルクを出し、ミルクを売れば新しい設備が買えます。色とりどりのスライムを交配させて、珍しい品種を目指しましょう。忙しい夜の、ゆっくりした時間に。",
      "features": ["50種以上のスライム", "放置で進むオート育成", "季節イベント", "のんびりBGM"],
      "rating_avg": 4.3,
      "review_count": 221,
      "downloads": 46500,
      "price": 0,
      "release_date": "2026-06-11",
      "platforms": ["Windows", "macOS", "Linux", "Web", "Android"],
      "art_style": "pixel",
      "palette": ["#1c3a2e", "#3f7d54"],
      "accent": "#a3e635",
      "featured": false,
      "trending": false,
      "is_new": false,
      "play_minutes": 900
    },
    {
      "slug": "void-runner",
      "title": "VOID RUNNER",
      "tagline": "止まれば、終わり。",
      "genre": "action",
      "tags": ["アクション", "難しい", "スピード"],
      "description": "崩れ落ちる宇宙を走り抜ける、反射神経勝負のエンドレスランナー。記録を更新し続けろ。",
      "about": "足場が消える。壁が迫る。あなたにできるのは、ただ走り続けることだけ。10秒で覚えて、10時間で極める。シンプルな操作と容赦ない難易度が、何度でも「もう一回」と思わせます。",
      "features": ["エンドレスモード", "デイリーランキング", "20体のアンロックキャラ", "残酷なほど正確な当たり判定"],
      "rating_avg": 4.2,
      "review_count": 356,
      "downloads": 89400,
      "price": 0,
      "release_date": "2026-05-30",
      "platforms": ["Windows", "macOS", "Linux", "Web", "iOS", "Android"],
      "art_style": "neon",
      "palette": ["#0d0d1a", "#3a1a5c"],
      "accent": "#a855f7",
      "featured": false,
      "trending": true,
      "is_new": false,
      "play_minutes": 60
    },
    {
      "slug": "hanabi-no-natsu",
      "title": "花火の夏",
      "tagline": "あの夏の花火を、もう一度。",
      "genre": "story",
      "tags": ["青春", "夏", "ノスタルジー"],
      "description": "田舎の夏祭りを舞台にした、少年少女のひと夏の記録。花火が上がる瞬間を、一緒に見ませんか。",
      "about": "祖母の家で過ごす夏休み。そこで出会ったのは、同じ年頃の女の子と、古いラジオ。花火大会の日まで、2人は秘密の場所を探します。ほんのり甘く、少しだけ切ない。夏の匂いがするビジュアルノベルです。",
      "features": ["約3時間のストーリー", "季節感あふれる背景イラスト", "夏の環境音", "エンディング後のおまけ"],
      "rating_avg": 4.8,
      "review_count": 289,
      "downloads": 36800,
      "price": 900,
      "release_date": "2026-08-14",
      "platforms": ["Windows", "macOS", "Web"],
      "art_style": "fireworks",
      "palette": ["#1d1035", "#60265c"],
      "accent": "#fb7185",
      "featured": false,
      "trending": false,
      "is_new": false,
      "play_minutes": 180
    },
    {
      "slug": "meikyu-no-junin",
      "title": "迷宮の住人",
      "tagline": "今日も迷宮は、誰かを待っている。",
      "genre": "rpg",
      "tags": ["ダンジョン", "クラフト", "ローグライク"],
      "description": "毎回姿を変える迷宮を探索するローグライクRPG。発見した素材で、あなただけの装備を作り出せ。",
      "about": "迷宮は生きている。朝と夜で姿を変え、あなたが踏み込んだ足跡を記憶します。罠を避け、モンスターと戦い、奥深くへ。死んでも失われるものはありません。得た知識こそが、次の冒険の武器になります。",
      "features": ["自動生成される迷宮", "200種類以上のアイテム", "クラフトと強化", "永久死亡なしの優しい設計"],
      "rating_avg": 4.5,
      "review_count": 412,
      "downloads": 63400,
      "price": 1000,
      "release_date": "2026-04-18",
      "platforms": ["Windows", "macOS", "Linux"],
      "art_style": "tower",
      "palette": ["#2a1f1a", "#5c4033"],
      "accent": "#fbbf24",
      "featured": false,
      "trending": true,
      "is_new": false,
      "play_minutes": 1200
    },
    {
      "slug": "tiny-kingdom",
      "title": "TINY KINGDOM",
      "tagline": "小さな王国の、大きな野望。",
      "genre": "strategy",
      "tags": ["RTS", "ピクセル", "短時間"],
      "description": "15分で決着つく、ミニマルなリアルタイムストラテジー。右手だけで、王国を築け。",
      "about": "小さな島に、小さな王国。資源を集め、兵を育て、隣の王国と戦う。すべてが15分で完結する、軽くて深いRTSです。マウスひとつで完結する操作感と、味のあるピクセルアートをお楽しみください。",
      "features": ["1プレイ約15分", "3つの文明", "24のユニット", "AIとの対戦とリプレイ"],
      "rating_avg": 4.1,
      "review_count": 156,
      "downloads": 27400,
      "price": 700,
      "release_date": "2026-03-09",
      "platforms": ["Windows", "macOS", "Linux", "Web"],
      "art_style": "pixel",
      "palette": ["#3a2318", "#7c5230"],
      "accent": "#fcd34d",
      "featured": false,
      "trending": false,
      "is_new": false,
      "play_minutes": 90
    },
    {
      "slug": "nami-no-mukou",
      "title": "波のむこう",
      "tagline": "海の向こうに、何があるか知っていますか？",
      "genre": "adventure",
      "tags": ["海洋", "探索", "アート"],
      "description": "小さな舟で海を渡る、静かで美しい探索ゲーム。波の音に耳を傾けながら、水平線を目指します。",
      "about": "波の音しかしない海の上で、あなたは小さな舟に乗っています。目指すのは、地図の外側。潮の流れを読み、星を頼りに進むうちに、海は少しずつその姿を変えていきます。言葉の少ない、映像と音で語る冒険です。",
      "features": ["美しい波のシミュレーション", "日々替わる海の風景", "写真モード", "心に響くオリジナル曲"],
      "rating_avg": 4.6,
      "review_count": 112,
      "downloads": 9700,
      "price": 800,
      "release_date": "2026-11-18",
      "platforms": ["Windows", "macOS"],
      "art_style": "ocean",
      "palette": ["#0f2f3d", "#2a6f80"],
      "accent": "#67e8f9",
      "featured": false,
      "trending": false,
      "is_new": true,
      "play_minutes": 150
    },
    {
      "slug": "gen-ei-ressha",
      "title": "幻影列車",
      "tagline": "終点のない列車で、あなたは誰を探す？",
      "genre": "horror",
      "tags": ["ホラー", "サスペンス", "列車"],
      "description": "眠れぬ夜に乗り込んだ列車。窓の外の景色は、だんだんと見覚えのないものへと変わっていきます。",
      "about": "終電を逃したあなたは、見慣れない列車に乗り込む。車内には誰もいないのに、誰かが話しかけてくる。窓の外を流れる景色は、記憶の断面のようです。降りるべき駅を探す、濃密な60分の旅。",
      "features": ["臨場感あふれる3Dサウンド", "6つの車両と分岐", "多重エンディング", "セーブは不可"],
      "rating_avg": 4.4,
      "review_count": 97,
      "downloads": 8400,
      "price": 600,
      "release_date": "2026-10-25",
      "platforms": ["Windows", "macOS", "Web"],
      "art_style": "city",
      "palette": ["#151320", "#3a2447"],
      "accent": "#c084fc",
      "featured": false,
      "trending": false,
      "is_new": true,
      "play_minutes": 60
    },
    {
      "slug": "hikari-no-hako",
      "title": "光の箱",
      "tagline": "暗闇に、光を灯す。それだけのこと。",
      "genre": "puzzle",
      "tags": ["パズル", "光学", "ミニマル"],
      "description": "光を反射させて、闇の中に隠された形を浮かび上がらせるパズル。シンプルなのに、夢中になれる。",
      "about": "真っ暗な部屋に、ひとつの光源。鏡を置き、角度を変え、光を届けたい場所へ導きます。必要な道具は最小限。なのに、最後のステージまで頭を悩ませられるはずです。",
      "features": ["100のステージ", "自由に配置できる鏡", "作者自身によるステージ設計", "満足感のある難易度曲線"],
      "rating_avg": 4.3,
      "review_count": 88,
      "downloads": 7200,
      "price": 0,
      "release_date": "2026-02-14",
      "platforms": ["Windows", "macOS", "Linux", "Web"],
      "art_style": "geometric",
      "palette": ["#1a1a2e", "#2f3b5c"],
      "accent": "#fde047",
      "featured": false,
      "trending": false,
      "is_new": false,
      "play_minutes": 150
    }
  ]$demo$) as x(
    slug text,
    title text,
    tagline text,
    genre text,
    tags text[],
    description text,
    about text,
    features text[],
    rating_avg numeric,
    review_count integer,
    downloads integer,
    price integer,
    release_date text,
    platforms text[],
    art_style text,
    palette text[],
    accent text,
    featured boolean,
    trending boolean,
    is_new boolean,
    play_minutes integer
  );

  insert into public.games (
    slug, author_id, genre, title, tagline, description, about, features,
    art_style, palette, accent, price, release_date, play_minutes, downloads,
    rating_avg, review_count, featured, trending, is_new, status, published_at
  )
  select
    d.slug,
    p_author_id,
    d.genre,
    d.title,
    d.tagline,
    d.description,
    d.about,
    d.features,
    d.art_style,
    d.palette,
    d.accent,
    d.price,
    d.release_date::date,
    d.play_minutes,
    d.downloads,
    d.rating_avg,
    d.review_count,
    d.featured,
    d.trending,
    d.is_new,
    'published',
    d.release_date::date::timestamptz
  from pg_temp.demo_games d
  on conflict (slug) do nothing;

  insert into public.game_tags (game_id, tag_id)
  select g.id, t.id
  from pg_temp.demo_games d
  join public.games g on g.slug = d.slug
  cross join unnest(d.tags) as tag(label)
  join public.tags t on t.label = tag.label
  on conflict (game_id, tag_id) do nothing;

  insert into public.game_platforms (game_id, platform_id)
  select g.id, p.id
  from pg_temp.demo_games d
  join public.games g on g.slug = d.slug
  cross join unnest(d.platforms) as platform(label)
  join public.platforms p on p.id = platform.label
  on conflict (game_id, platform_id) do nothing;

  -- Initial search_text is set by the BEFORE INSERT trigger; refresh to include tags.
  for r in
    select id from public.games
    where slug in (select slug from pg_temp.demo_games)
  loop
    perform private.refresh_game_search_text(r.id);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Triggers (drop first for idempotency)
-- -----------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists trg_set_updated_at_profiles on public.profiles;
create trigger trg_set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_games_set_derived on public.games;
create trigger trg_games_set_derived
  before insert or update on public.games
  for each row execute function public.set_game_derived_values();

-- AFTER trigger rebuilds search_text including tags and author display name.
drop trigger if exists trg_games_refresh_search on public.games;
create trigger trg_games_refresh_search
  after insert or update on public.games
  for each row execute function public.refresh_game_search_text_after();

drop trigger if exists trg_set_updated_at_games on public.games;
create trigger trg_set_updated_at_games
  before update on public.games
  for each row execute function public.set_updated_at();

drop trigger if exists trg_game_tags_refresh_search on public.game_tags;
create trigger trg_game_tags_refresh_search
  after insert or update or delete on public.game_tags
  for each row execute function public.refresh_game_search_text_from_tags();

drop trigger if exists trg_profiles_refresh_search on public.profiles;
create trigger trg_profiles_refresh_search
  after update of display_name, handle on public.profiles
  for each row execute function public.refresh_all_game_search_text();

drop trigger if exists trg_genres_refresh_search on public.genres;
create trigger trg_genres_refresh_search
  after update of label on public.genres
  for each row execute function public.refresh_all_game_search_text();

drop trigger if exists trg_tags_refresh_search on public.tags;
create trigger trg_tags_refresh_search
  after update of label on public.tags
  for each row execute function public.refresh_all_game_search_text();

drop trigger if exists trg_comments_validate_parent on public.comments;
create trigger trg_comments_validate_parent
  before insert or update of parent_id, game_id on public.comments
  for each row execute function public.validate_comment_parent();

drop trigger if exists trg_set_updated_at_comments on public.comments;
create trigger trg_set_updated_at_comments
  before update on public.comments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_reviews on public.reviews;
create trigger trg_set_updated_at_reviews
  before update on public.reviews
  for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at_collections on public.collections;
create trigger trg_set_updated_at_collections
  before update on public.collections
  for each row execute function public.set_updated_at();

drop trigger if exists trg_game_likes_count on public.game_likes;
create trigger trg_game_likes_count
  after insert or update or delete on public.game_likes
  for each row execute function private.sync_game_like_count();

drop trigger if exists trg_reviews_stats on public.reviews;
create trigger trg_reviews_stats
  after insert or update or delete on public.reviews
  for each row execute function private.sync_review_stats();

drop trigger if exists trg_follows_counts on public.follows;
create trigger trg_follows_counts
  after insert or update or delete on public.follows
  for each row execute function private.sync_follow_counts();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security: enable
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.genres enable row level security;
alter table public.tags enable row level security;
alter table public.platforms enable row level security;
alter table public.games enable row level security;
alter table public.game_tags enable row level security;
alter table public.game_platforms enable row level security;
alter table public.game_screenshots enable row level security;
alter table public.game_likes enable row level security;
alter table public.comments enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table storage.objects enable row level security;

-- -----------------------------------------------------------------------------
-- 6. RLS policies: drop then create (separate policies per role)
-- -----------------------------------------------------------------------------

-- profiles
drop policy if exists profiles_select_anon on public.profiles;
drop policy if exists profiles_select_auth on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;

create policy profiles_select_anon on public.profiles
  for select to anon using (true);
create policy profiles_select_auth on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

-- lookup tables
drop policy if exists genres_select_anon on public.genres;
drop policy if exists genres_select_auth on public.genres;
create policy genres_select_anon on public.genres for select to anon using (true);
create policy genres_select_auth on public.genres for select to authenticated using (true);

drop policy if exists tags_select_anon on public.tags;
drop policy if exists tags_select_auth on public.tags;
create policy tags_select_anon on public.tags for select to anon using (true);
create policy tags_select_auth on public.tags for select to authenticated using (true);

drop policy if exists platforms_select_anon on public.platforms;
drop policy if exists platforms_select_auth on public.platforms;
create policy platforms_select_anon on public.platforms for select to anon using (true);
create policy platforms_select_auth on public.platforms for select to authenticated using (true);

-- games
drop policy if exists games_select_anon_published on public.games;
drop policy if exists games_select_auth_visible on public.games;
drop policy if exists games_insert_own on public.games;
drop policy if exists games_update_own on public.games;
drop policy if exists games_delete_own on public.games;

create policy games_select_anon_published on public.games
  for select to anon using (status = 'published');
create policy games_select_auth_visible on public.games
  for select to authenticated
  using (status = 'published' or author_id = (select auth.uid()));
create policy games_insert_own on public.games
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy games_update_own on public.games
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy games_delete_own on public.games
  for delete to authenticated using (author_id = (select auth.uid()));

-- game_tags
drop policy if exists game_tags_select_anon on public.game_tags;
drop policy if exists game_tags_select_auth on public.game_tags;
drop policy if exists game_tags_insert_own on public.game_tags;
drop policy if exists game_tags_delete_own on public.game_tags;

create policy game_tags_select_anon on public.game_tags
  for select to anon
  using (private.is_game_published(game_id));
create policy game_tags_select_auth on public.game_tags
  for select to authenticated
  using (private.is_game_published(game_id) or private.is_game_owner(game_id));
create policy game_tags_insert_own on public.game_tags
  for insert to authenticated
  with check (private.is_game_owner(game_id));
create policy game_tags_delete_own on public.game_tags
  for delete to authenticated
  using (private.is_game_owner(game_id));

-- game_platforms
drop policy if exists game_platforms_select_anon on public.game_platforms;
drop policy if exists game_platforms_select_auth on public.game_platforms;
drop policy if exists game_platforms_insert_own on public.game_platforms;
drop policy if exists game_platforms_delete_own on public.game_platforms;

create policy game_platforms_select_anon on public.game_platforms
  for select to anon
  using (private.is_game_published(game_id));
create policy game_platforms_select_auth on public.game_platforms
  for select to authenticated
  using (private.is_game_published(game_id) or private.is_game_owner(game_id));
create policy game_platforms_insert_own on public.game_platforms
  for insert to authenticated
  with check (private.is_game_owner(game_id));
create policy game_platforms_delete_own on public.game_platforms
  for delete to authenticated
  using (private.is_game_owner(game_id));

-- game_screenshots
drop policy if exists game_screenshots_select_anon on public.game_screenshots;
drop policy if exists game_screenshots_select_auth on public.game_screenshots;
drop policy if exists game_screenshots_insert_own on public.game_screenshots;
drop policy if exists game_screenshots_update_own on public.game_screenshots;
drop policy if exists game_screenshots_delete_own on public.game_screenshots;

create policy game_screenshots_select_anon on public.game_screenshots
  for select to anon
  using (private.is_game_published(game_id));
create policy game_screenshots_select_auth on public.game_screenshots
  for select to authenticated
  using (private.is_game_published(game_id) or private.is_game_owner(game_id));
create policy game_screenshots_insert_own on public.game_screenshots
  for insert to authenticated
  with check (private.is_game_owner(game_id));
create policy game_screenshots_update_own on public.game_screenshots
  for update to authenticated
  using (private.is_game_owner(game_id))
  with check (private.is_game_owner(game_id));
create policy game_screenshots_delete_own on public.game_screenshots
  for delete to authenticated
  using (private.is_game_owner(game_id));

-- game_likes
drop policy if exists game_likes_select_own on public.game_likes;
drop policy if exists game_likes_insert_own on public.game_likes;
drop policy if exists game_likes_delete_own on public.game_likes;

create policy game_likes_select_own on public.game_likes
  for select to authenticated using (user_id = (select auth.uid()));
create policy game_likes_insert_own on public.game_likes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_game_published(game_id)
    and not private.is_game_owner(game_id)
  );
create policy game_likes_delete_own on public.game_likes
  for delete to authenticated using (user_id = (select auth.uid()));

-- comments
drop policy if exists comments_select_anon on public.comments;
drop policy if exists comments_select_auth on public.comments;
drop policy if exists comments_insert_own on public.comments;
drop policy if exists comments_update_own on public.comments;
drop policy if exists comments_delete_own on public.comments;

create policy comments_select_anon on public.comments
  for select to anon using (private.is_game_published(game_id));
create policy comments_select_auth on public.comments
  for select to authenticated
  using (private.is_game_published(game_id) or private.is_game_owner(game_id));
create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_game_published(game_id)
  );
create policy comments_update_own on public.comments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy comments_delete_own on public.comments
  for delete to authenticated using (user_id = (select auth.uid()));

-- reviews
drop policy if exists reviews_select_anon on public.reviews;
drop policy if exists reviews_select_auth on public.reviews;
drop policy if exists reviews_insert_own on public.reviews;
drop policy if exists reviews_update_own on public.reviews;
drop policy if exists reviews_delete_own on public.reviews;

create policy reviews_select_anon on public.reviews
  for select to anon using (private.is_game_published(game_id));
create policy reviews_select_auth on public.reviews
  for select to authenticated
  using (private.is_game_published(game_id) or private.is_game_owner(game_id));
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_review_game(game_id)
  );
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (user_id = (select auth.uid()));

-- follows
drop policy if exists follows_select_anon on public.follows;
drop policy if exists follows_select_auth on public.follows;
drop policy if exists follows_insert_own on public.follows;
drop policy if exists follows_delete_own on public.follows;

create policy follows_select_anon on public.follows for select to anon using (true);
create policy follows_select_auth on public.follows for select to authenticated using (true);
create policy follows_insert_own on public.follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy follows_delete_own on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- collections
drop policy if exists collections_select_anon_public on public.collections;
drop policy if exists collections_select_auth_visible on public.collections;
drop policy if exists collections_insert_own on public.collections;
drop policy if exists collections_update_own on public.collections;
drop policy if exists collections_delete_own on public.collections;

create policy collections_select_anon_public on public.collections
  for select to anon using (is_public);
create policy collections_select_auth_visible on public.collections
  for select to authenticated
  using (is_public or user_id = (select auth.uid()));
create policy collections_insert_own on public.collections
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy collections_update_own on public.collections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy collections_delete_own on public.collections
  for delete to authenticated using (user_id = (select auth.uid()));

-- collection_items
drop policy if exists collection_items_select_anon on public.collection_items;
drop policy if exists collection_items_select_auth on public.collection_items;
drop policy if exists collection_items_insert_own on public.collection_items;
drop policy if exists collection_items_update_own on public.collection_items;
drop policy if exists collection_items_delete_own on public.collection_items;

create policy collection_items_select_anon on public.collection_items
  for select to anon
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_public
    )
  );
create policy collection_items_select_auth on public.collection_items
  for select to authenticated
  using (
    private.is_collection_owner(collection_id)
    or exists (
      select 1 from public.collections c
      where c.id = collection_id and c.is_public
    )
  );
create policy collection_items_insert_own on public.collection_items
  for insert to authenticated
  with check (private.is_collection_owner(collection_id));
create policy collection_items_update_own on public.collection_items
  for update to authenticated
  using (private.is_collection_owner(collection_id))
  with check (private.is_collection_owner(collection_id));
create policy collection_items_delete_own on public.collection_items
  for delete to authenticated
  using (private.is_collection_owner(collection_id));

-- -----------------------------------------------------------------------------
-- 7. Privileges and column-level protection
--    service_role is intentionally left untouched (backend/admin access).
-- -----------------------------------------------------------------------------

revoke all on table public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (display_name, handle, avatar_url, bio) on public.profiles to authenticated;

revoke all on table public.genres from anon, authenticated;
revoke all on table public.tags from anon, authenticated;
revoke all on table public.platforms from anon, authenticated;
grant select on public.genres to anon, authenticated;
grant select on public.tags to anon, authenticated;
grant select on public.platforms to anon, authenticated;

-- Sensitive game columns are NOT grantable to authenticated:
--   id, author_id, downloads, rating_avg, review_count, like_count,
--   featured, trending, is_new, published_at, search_text,
--   created_at, updated_at.
revoke all on table public.games from anon, authenticated;
grant select on public.games to anon, authenticated;
grant insert (
  slug, title, tagline, description, about, features,
  art_style, palette, accent, cover_path,
  price, release_date, play_minutes, genre, status
) on public.games to authenticated;
grant update (
  slug, title, tagline, description, about, features,
  art_style, palette, accent, cover_path,
  price, release_date, play_minutes, genre, status
) on public.games to authenticated;
grant delete on public.games to authenticated;

revoke all on table public.game_tags from anon, authenticated;
grant select on public.game_tags to anon, authenticated;
grant insert (game_id, tag_id) on public.game_tags to authenticated;
grant delete on public.game_tags to authenticated;

revoke all on table public.game_platforms from anon, authenticated;
grant select on public.game_platforms to anon, authenticated;
grant insert (game_id, platform_id) on public.game_platforms to authenticated;
grant delete on public.game_platforms to authenticated;

revoke all on table public.game_screenshots from anon, authenticated;
grant select on public.game_screenshots to anon, authenticated;
grant insert (game_id, storage_path, alt_text, sort_order) on public.game_screenshots to authenticated;
grant update (alt_text, sort_order) on public.game_screenshots to authenticated;
grant delete on public.game_screenshots to authenticated;

revoke all on table public.game_likes from anon, authenticated;
grant select on public.game_likes to authenticated;
grant insert (user_id, game_id) on public.game_likes to authenticated;
grant delete on public.game_likes to authenticated;

revoke all on table public.comments from anon, authenticated;
grant select on public.comments to anon, authenticated;
grant insert (game_id, user_id, parent_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

revoke all on table public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert (game_id, user_id, rating, body) on public.reviews to authenticated;
grant update (rating, body) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

revoke all on table public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (follower_id, following_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

revoke all on table public.collections from anon, authenticated;
grant select on public.collections to anon, authenticated;
grant insert (user_id, slug, name, description, is_public) on public.collections to authenticated;
grant update (slug, name, description, is_public) on public.collections to authenticated;
grant delete on public.collections to authenticated;

revoke all on table public.collection_items from anon, authenticated;
grant select on public.collection_items to anon, authenticated;
grant insert (collection_id, game_id, note) on public.collection_items to authenticated;
grant update (note) on public.collection_items to authenticated;
grant delete on public.collection_items to authenticated;

-- Helper grants. Private schema usage was granted to service_role above.
grant usage on schema private to anon, authenticated;
grant execute on function
  private.path_uuid(text),
  private.is_game_owner(uuid),
  private.is_game_published(uuid),
  private.can_review_game(uuid),
  private.can_read_game_asset(uuid),
  private.is_collection_owner(uuid)
to anon, authenticated, service_role;

grant execute on function private.refresh_game_search_text(uuid) to service_role;
grant execute on function private.sync_game_like_count() to service_role;
grant execute on function private.sync_review_stats() to service_role;
grant execute on function private.sync_follow_counts() to service_role;
grant execute on function private.seed_demo_games(uuid) to service_role;

-- Trigger/RPC functions must not be directly callable via PostgREST.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.set_game_derived_values() from public, anon, authenticated;
revoke all on function public.refresh_game_search_text_after() from public, anon, authenticated;
revoke all on function public.validate_comment_parent() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.refresh_game_search_text_from_tags() from public, anon, authenticated;
revoke all on function public.refresh_all_game_search_text() from public, anon, authenticated;
revoke all on function public.increment_game_downloads(uuid, integer) from public, anon, authenticated;
grant execute on function public.increment_game_downloads(uuid, integer) to service_role;

-- -----------------------------------------------------------------------------
-- 8. Seed lookup data
--    'all' is NOT inserted: it is a UI-only filter in src/data/games.js.
-- -----------------------------------------------------------------------------

insert into public.genres (id, label, icon, sort_order) values
  ('action',      'アクション',         'zap',     1),
  ('adventure',   'アドベンチャー',     'compass', 2),
  ('puzzle',      'パズル',             'cube',    3),
  ('rpg',         'RPG',                'sword',   4),
  ('horror',      'ホラー',             'ghost',   5),
  ('simulation',  'シミュレーション',   'leaf',    6),
  ('platformer',  'プラットフォーマー', 'jump',    7),
  ('strategy',    'ストラテジー',       'crown',   8),
  ('story',       'ビジュアルノベル',   'book',    9)
on conflict (id) do update
set label = excluded.label,
    icon = excluded.icon,
    sort_order = excluded.sort_order;

insert into public.platforms (id) values
  ('Windows'), ('macOS'), ('Linux'), ('Web'), ('iOS'), ('Android')
on conflict (id) do nothing;

insert into public.tags (label) values
  ('SF'), ('ストーリー重視'), ('ターン制'),
  ('レーシング'), ('レトロ'), ('高速'),
  ('青春'), ('エモーショナル'), ('短編'),
  ('癒し'), ('探索'), ('ほのぼの'),
  ('パズル'), ('ミニマル'), ('頭脳'),
  ('ホラー'), ('心理'),
  ('プラットフォーマー'), ('難易度調整可'), ('ピクセル'),
  ('アート'), ('経営'), ('ゆるい'), ('かわいい'),
  ('アクション'), ('難しい'), ('スピード'),
  ('夏'), ('ノスタルジー'),
  ('ダンジョン'), ('クラフト'), ('ローグライク'),
  ('RTS'), ('短時間'), ('海洋'),
  ('サスペンス'), ('列車'), ('光学')
on conflict (label) do nothing;

-- Refresh any pre-existing games so their search_text includes seeded labels.
do $$
declare
  r record;
begin
  for r in select id from public.games loop
    perform private.refresh_game_search_text(r.id);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. Storage buckets and access control
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values
  ('avatars',         'avatars',         true),
  ('game-covers',     'game-covers',     true),
  ('game-screenshots','game-screenshots',true),
  ('game-assets',     'game-assets',     false)
on conflict (id) do update set public = excluded.public;

-- Bucket config columns are version-dependent; guard them with information_schema.
-- Limits: avatars/covers/screenshots 2 MiB per file; game-assets 50 MiB per file.
-- game-assets explicitly allows the formats needed to publish an HTML game
-- (html/css/js/json/wasm/zip plus common media and font types).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'buckets'
      and column_name = 'file_size_limit'
  ) then
    update storage.buckets
       set file_size_limit = case
             when id = 'game-assets' then 52428800  -- 50 MiB
             else 2097152                            -- 2 MiB
           end
     where id in ('avatars', 'game-covers', 'game-screenshots', 'game-assets');
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'storage'
      and table_name = 'buckets'
      and column_name = 'allowed_mime_types'
  ) then
    update storage.buckets
       set allowed_mime_types = case
             when id = 'game-assets' then array[
               -- HTML game core
               'text/html', 'text/css', 'text/javascript', 'application/javascript',
               'application/json', 'application/wasm',
               -- packaged builds
               'application/zip', 'application/x-zip-compressed',
               -- media used by games
               'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
               'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
               'video/mp4', 'video/webm',
               -- web fonts
               'font/woff', 'font/woff2', 'application/vnd.ms-fontobject'
             ]
             else array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
           end
     where id in ('avatars', 'game-covers', 'game-screenshots', 'game-assets');
  end if;
end;
$$;

-- storage.objects policies: drop then create.
drop policy if exists storage_avatars_select_anon on storage.objects;
drop policy if exists storage_avatars_select_auth on storage.objects;
drop policy if exists storage_avatars_insert_auth on storage.objects;
drop policy if exists storage_avatars_update_auth on storage.objects;
drop policy if exists storage_avatars_delete_auth on storage.objects;

create policy storage_avatars_select_anon on storage.objects
  for select to anon using (bucket_id = 'avatars');
create policy storage_avatars_select_auth on storage.objects
  for select to authenticated using (bucket_id = 'avatars');
create policy storage_avatars_insert_auth on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy storage_avatars_update_auth on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy storage_avatars_delete_auth on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Path convention: game-covers/<game_uuid>/<file>
drop policy if exists storage_covers_select_anon on storage.objects;
drop policy if exists storage_covers_select_auth on storage.objects;
drop policy if exists storage_covers_insert_auth on storage.objects;
drop policy if exists storage_covers_update_auth on storage.objects;
drop policy if exists storage_covers_delete_auth on storage.objects;

create policy storage_covers_select_anon on storage.objects
  for select to anon using (bucket_id = 'game-covers');
create policy storage_covers_select_auth on storage.objects
  for select to authenticated using (bucket_id = 'game-covers');
create policy storage_covers_insert_auth on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'game-covers'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_covers_update_auth on storage.objects
  for update to authenticated
  using (
    bucket_id = 'game-covers'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'game-covers'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_covers_delete_auth on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'game-covers'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );

-- Path convention: game-screenshots/<game_uuid>/<file>
drop policy if exists storage_shots_select_anon on storage.objects;
drop policy if exists storage_shots_select_auth on storage.objects;
drop policy if exists storage_shots_insert_auth on storage.objects;
drop policy if exists storage_shots_update_auth on storage.objects;
drop policy if exists storage_shots_delete_auth on storage.objects;

create policy storage_shots_select_anon on storage.objects
  for select to anon using (bucket_id = 'game-screenshots');
create policy storage_shots_select_auth on storage.objects
  for select to authenticated using (bucket_id = 'game-screenshots');
create policy storage_shots_insert_auth on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'game-screenshots'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_shots_update_auth on storage.objects
  for update to authenticated
  using (
    bucket_id = 'game-screenshots'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'game-screenshots'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_shots_delete_auth on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'game-screenshots'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );

-- Path convention: game-assets/<game_uuid>/<file>. Bucket is private.
-- Public read is allowed only for free published games; paid files need signed URLs.
drop policy if exists storage_assets_select_anon on storage.objects;
drop policy if exists storage_assets_select_auth on storage.objects;
drop policy if exists storage_assets_insert_auth on storage.objects;
drop policy if exists storage_assets_update_auth on storage.objects;
drop policy if exists storage_assets_delete_auth on storage.objects;

create policy storage_assets_select_anon on storage.objects
  for select to anon
  using (
    bucket_id = 'game-assets'
    and private.can_read_game_asset(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_assets_select_auth on storage.objects
  for select to authenticated
  using (
    bucket_id = 'game-assets'
    and private.can_read_game_asset(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_assets_insert_auth on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'game-assets'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_assets_update_auth on storage.objects
  for update to authenticated
  using (
    bucket_id = 'game-assets'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'game-assets'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );
create policy storage_assets_delete_auth on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'game-assets'
    and private.is_game_owner(private.path_uuid((storage.foldername(name))[1]))
  );

commit;
