-- Mangi : base de données, semaine 1
-- Mode d'emploi : dans Supabase, ouvre « SQL Editor », colle tout ce fichier, puis appuie sur « Run ».
-- À exécuter une seule fois sur un projet neuf.

create extension if not exists pgcrypto;

-- Types ------------------------------------------------------------------
create type user_role as enum ('mangaka', 'eclaireur', 'lecteur');
create type post_type as enum ('manga_carousel', 'short_video', 'text_status');
create type transaction_type as enum ('unlock_post', 'commission_escrow', 'direct_donation', 'payout_momo');
create type transaction_status as enum ('pending', 'completed', 'refunded');

-- Utilisateurs -----------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username varchar(30) not null unique,
  role user_role not null default 'lecteur',
  strikes_count int not null default 0,            -- justice de Mangigi
  is_restricted boolean not null default false,
  restriction_end_date timestamptz,
  coins_balance int not null default 0 check (coins_balance >= 0),
  mobile_money_number varchar(20),
  consistency_score double precision not null default 0,  -- régularité de publication
  created_at timestamptz not null default now()
);

-- Publications -----------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type post_type not null,
  caption text,
  media_urls text[] not null default '{}',
  is_locked boolean not null default false,        -- contenu payant à la carte
  coin_price int not null default 0 check (coin_price >= 0),
  original_post_id uuid references public.posts (id) on delete set null,  -- Smart Repost
  linked_manga_id uuid references public.posts (id) on delete set null,   -- contenu des éclaireurs
  created_at timestamptz not null default now(),
  constraint locked_has_price check (not is_locked or coin_price > 0)
);

create index posts_user_id_idx on public.posts (user_id);
create index posts_created_at_idx on public.posts (created_at desc);

-- Transactions -----------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users (id) on delete set null,
  receiver_id uuid references public.users (id) on delete set null,
  post_id uuid references public.posts (id) on delete set null,
  amount_coins int not null check (amount_coins > 0),
  type transaction_type not null,
  status transaction_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Création automatique du profil à l'inscription -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'artiste');
  chosen text := left(base, 24);
  chosen_role user_role;
begin
  begin
    chosen_role := coalesce(new.raw_user_meta_data ->> 'role', 'lecteur')::user_role;
  exception when others then
    chosen_role := 'lecteur';
  end;

  if exists (select 1 from public.users where username = chosen) then
    chosen := chosen || '_' || substr(md5(random()::text), 1, 4);
  end if;

  insert into public.users (id, username, role) values (new.id, chosen, chosen_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sécurité : droits d'accès ----------------------------------------------
alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.transactions enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.posts from anon, authenticated;
revoke all on public.transactions from anon, authenticated;

-- Un utilisateur lit son propre profil complet (solde, avertissements, numéro).
grant select on public.users to authenticated;
create policy "lire son profil" on public.users
  for select to authenticated using (auth.uid() = id);

-- Il ne peut modifier que son pseudo et son numéro Mobile Money.
-- Le solde, les avertissements et les restrictions ne se changent que côté serveur.
grant update (username, mobile_money_number) on public.users to authenticated;
create policy "modifier son profil" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Profils publics : uniquement les informations sans risque.
create view public.public_profiles as
  select id, username, role, consistency_score from public.users;
grant select on public.public_profiles to anon, authenticated;

-- Publications : visibles par les utilisateurs connectés.
-- Les médias des contenus payants seront protégés en semaine 6.
grant select, insert, update, delete on public.posts to authenticated;
create policy "lire les publications" on public.posts
  for select to authenticated using (true);
create policy "publier si non restreint" on public.posts
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.users u where u.id = auth.uid() and not u.is_restricted)
  );
create policy "modifier ses publications" on public.posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "supprimer ses publications" on public.posts
  for delete to authenticated using (auth.uid() = user_id);

-- Transactions : chacun voit les siennes, les écritures passeront par des fonctions serveur.
grant select on public.transactions to authenticated;
create policy "lire ses transactions" on public.transactions
  for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
