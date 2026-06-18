-- 0002_rooms_chat — Phase 4.5.2 (Rooms + Realtime)
-- Rooms, membership, and chat. All writes go through SECURITY DEFINER RPC
-- functions (clients never write these tables directly). RLS limits reads to
-- room members. Display name + mascot are denormalised onto room_players so a
-- client can render opponents without reading their owner-only profiles row.

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.rooms (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  game_id     text not null,
  host_id     text not null,                 -- auth.uid() of the host
  max_players int  not null default 8,
  is_public   boolean not null default true,
  status      text not null default 'waiting',
  invite_link text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id   uuid not null references public.rooms (id) on delete cascade,
  player_id text not null,                   -- auth.uid() for humans; synthetic for bots
  nickname  text not null,
  mascot    text not null,
  is_ready  boolean not null default false,
  is_bot    boolean not null default false,
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references public.rooms (id) on delete cascade,
  player_id  text,                            -- null for system messages
  kind       text not null default 'user',
  text       text not null,
  reactions  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_room_idx on public.chat_messages (room_id, created_at);

-- ─── Membership helper (used by RLS) ─────────────────────────────────────────

create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_id = p_room and player_id = auth.uid()::text
  );
$$;

-- ─── RLS — read-only for clients; writes happen via RPC below ─────────────────

alter table public.rooms        enable row level security;
alter table public.room_players enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "rooms_select" on public.rooms;
create policy "rooms_select" on public.rooms for select
  using (is_public or public.is_room_member(id));

drop policy if exists "room_players_select" on public.room_players;
create policy "room_players_select" on public.room_players for select
  using (public.is_room_member(room_id));

drop policy if exists "chat_select" on public.chat_messages;
create policy "chat_select" on public.chat_messages for select
  using (public.is_room_member(room_id));

-- Members may post their own user messages directly (cheap, high-frequency).
-- Everything else (reactions, system, room mutations) is RPC-only.
drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages for insert
  with check (
    kind = 'user'
    and player_id = auth.uid()::text
    and public.is_room_member(room_id)
  );

-- ─── Realtime: broadcast row changes to subscribed clients ───────────────────

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
alter publication supabase_realtime add table public.chat_messages;

-- ─── RPC — the authority layer (all SECURITY DEFINER) ────────────────────────

-- Join (or create) the room for a code. Creating it makes the caller host.
create or replace function public.join_room(p_code text, p_seed jsonb)
returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  v_room   public.rooms;
  v_uid    text := auth.uid()::text;
  v_nick   text := coalesce(p_seed->>'nickname', 'ผู้เล่น');
  v_mascot text := coalesce(p_seed->>'mascot', 'fox');
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_room from public.rooms where code = p_code;
  if not found then
    insert into public.rooms (code, name, game_id, host_id, max_players, is_public, invite_link)
    values (
      p_code,
      coalesce(p_seed->>'name', 'ห้องใหม่'),
      coalesce(p_seed->>'gameId', 'avalon'),
      v_uid,
      coalesce((p_seed->>'maxPlayers')::int, 8),
      coalesce((p_seed->>'isPublic')::boolean, true),
      coalesce(p_seed->>'inviteLink', '')
    )
    returning * into v_room;
  end if;

  insert into public.room_players (room_id, player_id, nickname, mascot, last_seen)
  values (v_room.id, v_uid, v_nick, v_mascot, now())
  on conflict (room_id, player_id)
  do update set nickname = excluded.nickname, mascot = excluded.mascot, last_seen = now();

  return v_room.id;
end;
$$;

-- Host guard used by mutating RPCs.
create or replace function public.assert_host(p_code text)
returns public.rooms
language plpgsql security definer
set search_path = public
as $$
declare v_room public.rooms;
begin
  select * into v_room from public.rooms where code = p_code;
  if not found then raise exception 'room not found'; end if;
  if v_room.host_id <> auth.uid()::text then raise exception 'host only'; end if;
  return v_room;
end;
$$;

create or replace function public.set_ready(p_code text, p_ready boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.room_players rp set is_ready = p_ready, last_seen = now()
  from public.rooms r
  where r.code = p_code and rp.room_id = r.id and rp.player_id = auth.uid()::text;
end;
$$;

create or replace function public.touch_presence(p_code text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.room_players rp set last_seen = now()
  from public.rooms r
  where r.code = p_code and rp.room_id = r.id and rp.player_id = auth.uid()::text;
end;
$$;

create or replace function public.update_settings(p_code text, p_settings jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms := public.assert_host(p_code);
begin
  update public.rooms set
    name        = coalesce(p_settings->>'name', name),
    max_players = coalesce((p_settings->>'maxPlayers')::int, max_players),
    is_public   = coalesce((p_settings->>'isPublic')::boolean, is_public),
    game_id     = coalesce(p_settings->>'gameId', game_id)
  where id = v_room.id;
end;
$$;

create or replace function public.kick_player(p_code text, p_target text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms := public.assert_host(p_code);
begin
  if p_target = v_room.host_id then raise exception 'cannot kick host'; end if;
  delete from public.room_players where room_id = v_room.id and player_id = p_target;
end;
$$;

create or replace function public.transfer_host(p_code text, p_target text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms := public.assert_host(p_code);
begin
  if not exists (select 1 from public.room_players where room_id = v_room.id and player_id = p_target)
    then raise exception 'target not in room'; end if;
  update public.rooms set host_id = p_target where id = v_room.id;
end;
$$;

create or replace function public.add_bot(p_code text, p_bot jsonb)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms := public.assert_host(p_code);
declare v_count int;
begin
  select count(*) into v_count from public.room_players where room_id = v_room.id;
  if v_count >= v_room.max_players then return; end if;
  insert into public.room_players (room_id, player_id, nickname, mascot, is_ready, is_bot)
  values (v_room.id, p_bot->>'id', p_bot->>'name', p_bot->>'mascot', true, true)
  on conflict (room_id, player_id) do nothing;
end;
$$;

-- Leaving: remove self; hand off host if needed; drop the room when empty.
create or replace function public.leave_room(p_code text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_room public.rooms;
  v_uid  text := auth.uid()::text;
  v_next text;
begin
  select * into v_room from public.rooms where code = p_code;
  if not found then return; end if;

  delete from public.room_players where room_id = v_room.id and player_id = v_uid;

  if not exists (select 1 from public.room_players where room_id = v_room.id and is_bot = false) then
    delete from public.rooms where id = v_room.id;  -- no humans left
    return;
  end if;

  if v_room.host_id = v_uid then
    select player_id into v_next from public.room_players
      where room_id = v_room.id and is_bot = false order by joined_at limit 1;
    if v_next is not null then update public.rooms set host_id = v_next where id = v_room.id; end if;
  end if;
end;
$$;

create or replace function public.toggle_reaction(p_message uuid, p_emoji text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_uid  text := auth.uid()::text;
  v_room uuid;
  v_reactions jsonb;
  v_entry jsonb;
  v_by jsonb;
  v_idx int;
begin
  select room_id, reactions into v_room, v_reactions from public.chat_messages where id = p_message;
  if v_room is null or not public.is_room_member(v_room) then raise exception 'not allowed'; end if;

  -- find existing entry for this emoji
  select i - 1 into v_idx from jsonb_array_elements(v_reactions) with ordinality e(val, i)
    where val->>'emoji' = p_emoji limit 1;

  if v_idx is null then
    v_reactions := v_reactions || jsonb_build_array(
      jsonb_build_object('emoji', p_emoji, 'by', jsonb_build_array(v_uid)));
  else
    v_entry := v_reactions->v_idx;
    v_by := v_entry->'by';
    if v_by @> to_jsonb(v_uid) then
      v_by := (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(v_by) x where x <> v_uid);
    else
      v_by := v_by || to_jsonb(v_uid);
    end if;
    if jsonb_array_length(v_by) = 0 then
      v_reactions := (select coalesce(jsonb_agg(val), '[]'::jsonb)
        from jsonb_array_elements(v_reactions) with ordinality e(val, i) where i - 1 <> v_idx);
    else
      v_reactions := jsonb_set(v_reactions, array[v_idx::text], jsonb_set(v_entry, '{by}', v_by));
    end if;
  end if;

  update public.chat_messages set reactions = v_reactions where id = p_message;
end;
$$;

create or replace function public.send_system(p_code text, p_text text)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_room public.rooms := public.assert_host(p_code);
begin
  insert into public.chat_messages (room_id, player_id, kind, text)
  values (v_room.id, null, 'system', p_text);
end;
$$;
