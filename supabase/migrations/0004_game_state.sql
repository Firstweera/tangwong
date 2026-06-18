-- 0004_game_state — Phase 4.5.3 (Game Sync + Hidden Info) · B1
-- Server-authoritative game state for a live match. The Edge Function (Option B,
-- lands in B2+) is the ONLY writer — it runs the existing TS engine with the
-- service role. Clients can READ (RLS) but never write these tables.
--
-- Hidden information is enforced by RLS on game_private: a player may read ONLY
-- their own private slice (role + vision). Public state and the action log are
-- readable by any room member. See docs/phase-4.5.3-plan.md §3.
--
-- Depends on 0002 (public.is_room_member, public.rooms).

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- One public snapshot per room (readable by every room member).
create table if not exists public.game_states (
  room_id          uuid primary key references public.rooms (id) on delete cascade,
  game_id          text not null,
  phase            text not null,
  turn             int  not null default 0,
  round            int  not null default 0,
  active_player_id text,
  public_data      jsonb not null default '{}'::jsonb,   -- TPublic (+ end-game reveal blob)
  winner           jsonb,                                 -- WinResult | null
  status           text not null default 'in-game',       -- in-game | ended
  version          int  not null default 0,               -- optimistic-concurrency guard
  updated_at       timestamptz not null default now()
);

-- One private slice per (room, player). RLS: ONLY the owner may read it.
create table if not exists public.game_private (
  room_id      uuid not null references public.rooms (id) on delete cascade,
  player_id    text not null,                             -- auth.uid() for humans; synthetic for bots
  private_data jsonb not null default '{}'::jsonb,        -- TPrivate (role, vision, secret cards)
  updated_at   timestamptz not null default now(),
  primary key (room_id, player_id)
);

-- Append-only action log (audit + replay + "what happened"). Public-safe payloads.
create table if not exists public.game_actions (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.rooms (id) on delete cascade,
  player_id  text not null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists game_actions_room_idx on public.game_actions (room_id, id);

-- ─── RLS — read-only for clients; the Edge Function (service role) is the writer ─

alter table public.game_states  enable row level security;
alter table public.game_private enable row level security;
alter table public.game_actions enable row level security;

-- Public snapshot: any room member may read.
drop policy if exists "game_states_select" on public.game_states;
create policy "game_states_select" on public.game_states for select
  using (public.is_room_member(room_id));

-- THE hidden-info boundary: a player reads ONLY their own private row.
drop policy if exists "game_private_select_own" on public.game_private;
create policy "game_private_select_own" on public.game_private for select
  using (player_id = auth.uid()::text);

-- Action log: any room member may read (payloads must stay public-safe).
drop policy if exists "game_actions_select" on public.game_actions;
create policy "game_actions_select" on public.game_actions for select
  using (public.is_room_member(room_id));

-- NOTE: intentionally NO insert/update/delete policies on any of the three
-- tables. With RLS enabled and no write policy, every direct client write is
-- rejected. The Edge Function uses the service_role key, which bypasses RLS.

-- ─── Realtime: broadcast row changes to subscribed clients (RLS-filtered) ─────

-- game_states change → every member refetches public state.
-- game_private change → ONLY the owner receives it (owner-only SELECT policy) —
--   this is the live hidden-info channel.
-- game_actions change → members see the live action feed.
alter publication supabase_realtime add table public.game_states;
alter publication supabase_realtime add table public.game_private;
alter publication supabase_realtime add table public.game_actions;
