-- Seed data for local development.
-- The wallets table references auth.users, so the seed only inserts
-- a wallet when the referenced user already exists. This keeps the
-- seed idempotent and safe to run against a fresh database.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  order by created_at asc
  limit 1;

  if v_user_id is not null then
    insert into public.wallets (user_id, public_key, label, network)
    values (
      v_user_id,
      'GCATTQWOHKGHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHWCHW',
      'Seed wallet',
      'testnet'
    )
    on conflict (user_id, public_key) do nothing;
  end if;
end $$;$$
