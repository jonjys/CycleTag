-- Isolated StayTag tables. Browser/anonymous/authenticated roles have NO access.
-- An authenticated Edge Function calls one service-role-only, invoker RPC.
create table public.staytag_share_services (
  environment text primary key check (environment in ('production', 'sandbox')),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$')
);
create table public.staytag_shared_moves (
  id uuid primary key,
  environment text not null references public.staytag_share_services(environment),
  title text not null check (length(title) between 1 and 40),
  owner_hash text not null check (owner_hash ~ '^[a-f0-9]{64}$'),
  helper_hash text not null check (helper_hash ~ '^[a-f0-9]{64}$' and helper_hash <> owner_hash),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index staytag_shared_moves_expiry on public.staytag_shared_moves(expires_at);
create index staytag_shared_moves_environment on public.staytag_shared_moves(environment);
create table public.staytag_shared_boxes (
  move_id uuid not null references public.staytag_shared_moves(id) on delete cascade,
  n integer not null check (n between 1 and 999),
  room text not null check (length(room) between 1 and 30),
  fragile boolean not null,
  heavy boolean not null,
  state text not null default 'packed' check (state in ('packed', 'loaded', 'delivered')),
  note text not null default '' check (length(note) <= 300),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  updated_by text check (updated_by in ('owner', 'helper')),
  primary key (move_id, n)
);
create table public.staytag_share_limits (
  environment text not null,
  client_hash text not null check (client_hash ~ '^[a-f0-9]{64}$'),
  hour timestamptz not null,
  count integer not null default 1,
  primary key (environment, client_hash, hour)
);
alter table public.staytag_share_services enable row level security;
alter table public.staytag_shared_moves enable row level security;
alter table public.staytag_shared_boxes enable row level security;
alter table public.staytag_share_limits enable row level security;
revoke all on public.staytag_share_services, public.staytag_shared_moves, public.staytag_shared_boxes, public.staytag_share_limits from public, anon, authenticated;
grant select, insert, update, delete on public.staytag_share_services, public.staytag_shared_moves, public.staytag_shared_boxes, public.staytag_share_limits to service_role;

create function public.staytag_shared_action(p_environment text, p_action text, p_id uuid, p_key_hash text, p_data jsonb default '{}', p_client_hash text default '')
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  m public.staytag_shared_moves%rowtype;
  b public.staytag_shared_boxes%rowtype;
  access_role text;
  box_rows jsonb;
  limit_count integer;
begin
  if p_action = 'create' then
    -- Creation is idempotent for the same id + owner key, even after a lost response.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('staytag-create-' || p_environment));
    select * into m from public.staytag_shared_moves where id = p_id;
    if not found then
      if p_key_hash !~ '^[a-f0-9]{64}$' or (p_data->>'helper_hash') !~ '^[a-f0-9]{64}$'
        or p_key_hash = p_data->>'helper_hash' or p_client_hash !~ '^[a-f0-9]{64}$'
        or length(p_data->>'title') not between 1 and 40
        or jsonb_typeof(p_data->'boxes') <> 'array'
        or jsonb_array_length(p_data->'boxes') not between 1 and 300 then
        return jsonb_build_object('status', 'invalid');
      end if;
      insert into public.staytag_share_limits(environment, client_hash, hour)
      values (p_environment, p_client_hash, date_trunc('hour', now()))
      on conflict (environment, client_hash, hour) do update set count = public.staytag_share_limits.count + 1
      returning count into limit_count;
      if limit_count > 6 or (select count(*) from public.staytag_shared_moves where environment = p_environment and expires_at > now()) >= 1000 then
        return jsonb_build_object('status', 'limited');
      end if;
      insert into public.staytag_shared_moves(id, environment, title, owner_hash, helper_hash)
      values (p_id, p_environment, p_data->>'title', p_key_hash, p_data->>'helper_hash') returning * into m;
      insert into public.staytag_shared_boxes(move_id, n, room, fragile, heavy)
      select p_id, x.n, x.room, x.fragile, x.heavy
      from jsonb_to_recordset(p_data->'boxes') as x(n integer, room text, fragile boolean, heavy boolean);
    end if;
  end if;

  -- Authorisation and writes share a row lock: a revoked helper cannot race a write.
  select * into m from public.staytag_shared_moves where id = p_id and environment = p_environment for update;
  if not found or m.expires_at <= now() then return jsonb_build_object('status', 'not_found'); end if;
  if p_key_hash = m.owner_hash then access_role := 'owner';
  elsif p_key_hash = m.helper_hash then access_role := 'helper';
  else return jsonb_build_object('status', 'not_found'); end if;
  if p_action in ('create', 'rotate', 'delete') and access_role <> 'owner' then return jsonb_build_object('status', 'forbidden'); end if;

  if p_action = 'delete' then
    delete from public.staytag_shared_moves where id = p_id;
    return jsonb_build_object('status', 'deleted');
  elsif p_action = 'rotate' then
    if (p_data->>'helper_hash') !~ '^[a-f0-9]{64}$' or p_data->>'helper_hash' = m.owner_hash then return jsonb_build_object('status', 'invalid'); end if;
    update public.staytag_shared_moves set helper_hash = p_data->>'helper_hash' where id = p_id;
  elsif p_action = 'update' then
    select * into b from public.staytag_shared_boxes where move_id = p_id and n = (p_data->>'n')::integer;
    if not found then return jsonb_build_object('status', 'invalid'); end if;
    if b.revision <> (p_data->>'revision')::integer then return jsonb_build_object('status', 'conflict'); end if;
    if p_data->>'state' not in ('packed', 'loaded', 'delivered') or length(p_data->>'note') > 300 then return jsonb_build_object('status', 'invalid'); end if;
    if b.state = 'packed' and p_data->>'state' = 'delivered' then return jsonb_build_object('status', 'load_first'); end if;
    update public.staytag_shared_boxes set state = p_data->>'state', note = p_data->>'note', revision = revision + 1, updated_at = now(), updated_by = access_role
    where move_id = p_id and n = b.n;
  elsif p_action not in ('read', 'create') then
    return jsonb_build_object('status', 'invalid');
  end if;
  select jsonb_agg(jsonb_build_object('n', n, 'room', room, 'fragile', fragile, 'heavy', heavy,
    'state', state, 'note', note, 'revision', revision, 'updatedAt', updated_at, 'updatedBy', updated_by) order by n)
    into box_rows from public.staytag_shared_boxes where move_id = p_id;
  return jsonb_build_object('status', 'ok', 'move', jsonb_build_object('id', m.id, 'title', m.title,
    'role', access_role, 'helperKeyId', case when access_role = 'owner' then left(case when p_action = 'rotate' then p_data->>'helper_hash' else m.helper_hash end, 12) else null end,
    'createdAt', m.created_at, 'expiresAt', m.expires_at, 'boxes', coalesce(box_rows, '[]'::jsonb)));
end;
$$;
revoke all on function public.staytag_shared_action(text, text, uuid, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.staytag_shared_action(text, text, uuid, text, jsonb, text) to service_role;

-- Expired links are refused by the RPC immediately; hourly cleanup removes the rows.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('staytag-shared-retention', '17 * * * *', $job$
  delete from public.staytag_shared_moves where expires_at <= now();
  delete from public.staytag_share_limits where hour < now() - interval '2 days';
$job$);
