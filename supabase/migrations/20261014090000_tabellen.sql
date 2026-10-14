-- Arbeitspaket 003: Tabellen für Räume, Mitgliedschaften, aktuelle Runde und Stimmen.
-- Siehe docs/daten-und-aktionsvertrag.md. Zugriffsrechte folgen in der nächsten Migration.

-- Raum. Die Revision wird bei jeder sichtbaren Änderung erhöht (Signal für Echtzeit).
create table public.rooms (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  revision   bigint      not null default 1
);

-- Einladungstoken, bewusst getrennt vom Raum. Zugriff nur über Datenbankfunktionen.
-- 24 Zufallsbytes URL-sicher kodiert ergeben 32 Zeichen.
create table public.room_invites (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  token   text not null unique,
  constraint room_invites_token_format check (token ~ '^[A-Za-z0-9_-]{32,}$')
);

-- Mitgliedschaft. Nutzer-IDs sind anonyme oder reguläre Supabase-Auth-IDs.
create table public.room_members (
  room_id      uuid        not null references public.rooms (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  display_name text        not null,
  joined_at    timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint room_members_display_name_valid
    check (display_name = btrim(display_name) and char_length(display_name) between 1 and 40)
);

-- Zugriffe nach Nutzer (Rechteprüfung, Austritt) brauchen einen Index auf user_id.
create index room_members_user_id_idx on public.room_members (user_id);

-- Aktuelle Runde: höchstens eine je Raum. Ein Rundenwechsel ersetzt die Zeile und vergibt
-- eine neue round_id.
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

-- Stimme: höchstens eine je Person und Raum.
-- Die zusammengesetzten Fremdschlüssel erzwingen:
--  * Die Stimme gehört zur aktuellen Runde desselben Raums. Beim Rundenwechsel müssen die
--    Stimmen zuerst gelöscht werden, sonst scheitert die Änderung von round_id (kein
--    ON UPDATE CASCADE, damit keine Stimme in eine andere Runde wandern kann).
--  * Die Person ist Mitglied desselben Raums. Beim Austritt verschwindet die Stimme mit.
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

-- Löschen/Ersetzen einer Runde sucht die zugehörigen Stimmen über (room_id, round_id).
create index votes_round_idx on public.votes (room_id, round_id);
