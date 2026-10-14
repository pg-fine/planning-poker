-- Work package 003: access rights and row level security.
-- Principle: the browser may only read, and only data of rooms the person is a member of.
-- All changes later go through database functions (work packages 005-007).

-- Internal schema name for helper functions. Not exposed by the Supabase API
-- (only the schema "public" is released as API).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Membership check for the policies. SECURITY DEFINER bypasses RLS on room_members and
-- thus avoids a recursive policy. Fixed search_path, only own membership can be checked.
create function private.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.room_members m
    where m.room_id = p_room_id
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_room_member(uuid) from public, anon, authenticated;
grant execute on function private.is_room_member(uuid) to authenticated;

-- Enable RLS everywhere.
alter table public.rooms        enable row level security;
alter table public.room_invites enable row level security;
alter table public.room_members enable row level security;
alter table public.rounds       enable row level security;
alter table public.votes        enable row level security;

-- Revoke existing rights (including those granted by Supabase by default), then grant selectively.
revoke all on public.rooms        from public, anon, authenticated;
revoke all on public.room_invites from public, anon, authenticated;
revoke all on public.room_members from public, anon, authenticated;
revoke all on public.rounds       from public, anon, authenticated;
revoke all on public.votes        from public, anon, authenticated;

-- Read only, only for signed-in people (anonymous sign-in counts as "authenticated").
-- room_invites stays without any right and without a policy: only SECURITY DEFINER functions
-- access it.
grant select on public.rooms        to authenticated;
grant select on public.room_members to authenticated;
grant select on public.rounds       to authenticated;
grant select on public.votes        to authenticated;

create policy rooms_select_members on public.rooms
  for select to authenticated
  using (private.is_room_member(id));

create policy room_members_select_members on public.room_members
  for select to authenticated
  using (private.is_room_member(room_id));

create policy rounds_select_members on public.rounds
  for select to authenticated
  using (private.is_room_member(room_id));

create policy votes_select_members on public.votes
  for select to authenticated
  using (private.is_room_member(room_id));

-- Write access is deliberately not granted: no INSERT/UPDATE/DELETE rights
-- and no matching policies. Access is granted selectively by functions in 005-007.
