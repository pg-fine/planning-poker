-- Work package 003: tables for rooms, memberships, the current round and votes.
-- See docs/data-and-action-contract.md. Access rights follow in the next migration.

-- Room. The revision is increased on every visible change (signal for realtime).
create table public.rooms (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  revision   bigint      not null default 1
);

-- Invitation token, deliberately separate from the room. Access only via database functions.
-- 24 random bytes, URL-safe encoded, give 32 characters.
create table public.room_invites (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  token   text not null unique,
  constraint room_invites_token_format check (token ~ '^[A-Za-z0-9_-]{32,}$')
);

-- Membership. User IDs are anonymous or regular Supabase auth IDs.
create table public.room_members (
  room_id      uuid        not null references public.rooms (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  display_name text        not null,
  joined_at    timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint room_members_display_name_valid
    check (display_name = btrim(display_name) and char_length(display_name) between 1 and 40)
);

-- Lookups by user (permission check, leaving) need an index on user_id.
create index room_members_user_id_idx on public.room_members (user_id);

-- Current round: at most one per room. A round switch replaces the row and assigns
-- a new round_id.
create table public.rounds (
  room_id    uuid        primary key references public.rooms (id) on delete cascade,
  round_id   uuid        not null default gen_random_uuid(),
  title      text        not null,
  status     text        not null default 'open',
  started_by uuid        not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  constraint rounds_round_id_per_room unique (room_id, round_id),
  constraint rounds_title_valid
    check (title = btrim(title) and char_length(title) between 1 and 120),
  constraint rounds_status_valid check (status in ('open', 'revealed'))
);

-- Vote: at most one per person and room.
-- The composite foreign keys enforce:
--  * The vote belongs to the current round of the same room. When switching rounds, the
--    votes must be deleted first, otherwise changing round_id fails (no
--    ON UPDATE CASCADE, so no vote can move to another round).
--  * The person is a member of the same room. When leaving, the vote used to disappear too
create table public.votes (
  room_id  uuid not null,
  user_id  uuid not null,
  round_id uuid not null,
  card     text not null,
  primary key (room_id, user_id),
  constraint votes_round_fkey
    foreign key (room_id, round_id)
    references public.rounds (room_id, round_id)
    on delete cascade,
  constraint votes_member_fkey
    foreign key (room_id, user_id)
    references public.room_members (room_id, user_id)
    on delete cascade,
  constraint votes_card_valid
    check (card in ('0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee'))
);

-- Deleting/replacing a round looks up the related votes via (room_id, round_id).
create index votes_round_idx on public.votes (room_id, round_id);
