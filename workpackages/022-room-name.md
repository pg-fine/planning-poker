# 022 – Optional room name

- **Status:** Done
- **Dependencies:** 021
- **Milestone:** M7: UX iteration 2
- **Origin:** UX assessment (point 5), moved out of 021

## Goal

A room can carry a name, e.g. "Team Atlas – Refinement". It appears in the room and in
the "Recently used rooms" list instead of the token ending.

## Prerequisite

The name belongs to the room and therefore has to be in the database (new column `rooms.name`,
`create_room` with an optional name, members may read and change it). The new migration
had to be applied by you in the Supabase project; I have no access to it.

## Tasks

- New migration `supabase/migrations/…_room_name.sql`: column, length check (e.g. 1–60 characters),
  `create_room(p_display_name, p_room_name)` with a default value, function for changing by members.
  Existing rooms stay valid without a name.
- Extend `docs/data-and-action-contract.md` and `docs/supabase-setup.md`.
- Form field "Room name (optional)" on the home page; display in the room header and in the list.
- Be able to change the room name in the room.
- Backward compatibility: the app must keep working with the old database until the migration
  is applied, or the order of deployment is documented.

## Acceptance criteria

- Rooms without a name behave unchanged.
- The name is only readable and changeable by members of the room (data isolation from 003 stays).
- Type check, lint, build; manual check with two profiles.

## Verification and result

Migration `supabase/migrations/20261014090700_room_name.sql`:

- `rooms.name` (NULL or 1-60 characters, without whitespace at the edges), `create_room(display_name, room_name
  default null)` (old calls with one argument keep working), `set_room_name` for
  members, snapshot with `name`. New error code `invalid_room_name`.
- The migration builds on `20261014090600` (both change `room_snapshot`); keep the order.

App:

- Home page: field "Room name (optional)". Without a name the app sends the old call, so that
  creating also works before the migration is applied.
- Room: name as heading; "Save room name" under "Room and help" (empty removes the name).
- "Recently used rooms" show the room name (otherwise "Room …" plus token ending) and keep it up to date.

Verified: migrations locally in PostgreSQL 16 (Docker): the name is stored trimmed, a
61-character name yields `invalid_room_name`, `create_room` with one argument works,
members change/clear the name, non-members get `not_member`. User interface in the browser
(Playwright): field on the home page, creating without a name against the old database, heading,
changing the name (with simulated responses, since the migration was still missing in the real project),
list shows the name; axe-core without findings. Type check, lint, build error-free.
After applying the migrations (14.10.2026), verified against the real Supabase project: creating with a
name (whitespace is removed), second person sees the name, changing by the second person appears
live for the first, clearing removes the heading.
