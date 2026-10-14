-- Arbeitspaket 003: Zugriffsrechte und Row Level Security.
-- Grundsatz: Der Browser darf nur lesen, und nur Daten von Räumen, in denen die Person
-- Mitglied ist. Alle Änderungen laufen später über Datenbankfunktionen (Arbeitspakete 005-007).

-- Interner Schemaname für Hilfsfunktionen. Wird von der Supabase-API nicht veröffentlicht
-- (nur das Schema "public" ist als API freigegeben).
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Mitgliedschaftsprüfung für die Policies. SECURITY DEFINER umgeht RLS auf room_members und
-- vermeidet so eine rekursive Policy. Fester search_path, nur eigene Mitgliedschaft prüfbar.
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

-- RLS überall aktivieren.
alter table public.rooms        enable row level security;
alter table public.room_invites enable row level security;
alter table public.room_members enable row level security;
alter table public.rounds       enable row level security;
alter table public.votes        enable row level security;

-- Vorhandene (auch von Supabase standardmäßig vergebene) Rechte entziehen, dann gezielt vergeben.
revoke all on public.rooms        from public, anon, authenticated;
revoke all on public.room_invites from public, anon, authenticated;
revoke all on public.room_members from public, anon, authenticated;
revoke all on public.rounds       from public, anon, authenticated;
revoke all on public.votes        from public, anon, authenticated;

-- Nur Lesen, nur für angemeldete Personen (anonyme Anmeldung zählt als "authenticated").
-- room_invites bleibt ohne jedes Recht und ohne Policy: nur SECURITY-DEFINER-Funktionen
-- greifen darauf zu.
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

-- Schreibzugriffe sind absichtlich nicht freigegeben: keine INSERT/UPDATE/DELETE-Rechte
-- und keine entsprechenden Policies. Freigaben erfolgen gezielt durch Funktionen in 005-007.
