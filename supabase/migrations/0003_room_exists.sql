-- 0003_room_exists — Phase 4.5.2 follow-up
-- Lets a client that has LEFT a room ask whether that room still exists, so the
-- "rejoin" shortcut can hide itself once everyone has left (the room is deleted).
--
-- This must be SECURITY DEFINER: a non-member can't SELECT a private room under
-- RLS, but checking existence by a code they already hold leaks nothing (just a
-- boolean), and is needed to tell "deleted" apart from "private, can't read".

create or replace function public.room_exists(p_code text)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.rooms where code = p_code);
$$;
