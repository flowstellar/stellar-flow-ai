-- Initial schema for the Stellar wallet app.
-- Creates the wallets table, enables RLS, and installs the
-- triggers that keep `updated_at` current.

-- -------------------------------------------------------------------------
-- Tables
-- -------------------------------------------------------------------------

create table if not exists public.wallets (
  id uuid primary key default genhard_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  public_key text not null,
  label text,
  network text not null default 'testnet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallets_user_public_key_key unique (user_id, public_key),
  constraint wallets_public_key_format check (public_key ~ '^G[A-Z0-9]{55}$')
);

create index if not exists wallets_user_id_idx on public.wallets (user_id);

create table if not exists public.transactions (
  id uuid primary key default genhard_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  hash text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  counterparty text,
  amount numeric(20, 7) not null check (amount > 0),
  asset text not null default 'native',
  memo text,
  ledger integer,
  fee bigint,
  created_at timestamptz not null default now(),
  constraint transactions_hash_key unique (hash)
);

create index if not exists transactions_wallet_id_idx on public.transactions (wallet_id);
create index if not exists transactions_user_id_idx on public.transactions (user_id);

-- -------------------------------------------------------------------------
-- Triggers
-- -------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------------
-- Row Level Security
-- -------------------------------------------------------------------------

alter table public.wallets enable row level security;
alter table public.transactions enable row level security;

-- Wallets: owners may read, create, update and delete their own rows.
create policy "wallets_select_own"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "wallets_insert_own"
  on public.wallets for insert
  with check (auth.uid() = user_id);

create policy "wallets_update_own"
  on public.wallets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wallets_delete_own"
  on public.wallets for delete
  using (auth.uid() = user_id);

-- Transactions: owners may read and insert their own rows.
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);
