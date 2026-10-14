# 003 – Database schema and read access

- **Status:** Done
- **Dependencies:** 002
- **Milestone:** M1

## Goal

Create versionable SQL migrations for the current round and room-bound data.

## Tasks

- Have the user create a Supabase Free project; document the first setup.
- Create SQL migrations in the repository for rooms, memberships, current rounds and votes.
- Define foreign keys, unique keys, value checks and required indexes.
- Prevent cross-room assignments and double votes through database rules.
- Enable row level security (RLS) for all tables reachable by the app.
- Limit reading to own memberships or rooms with an own membership.
- Keep the invitation token separate and not accessible through normal table reads;
  only required access functions may access it.
- Block write access at first; grants are made selectively by the following packages.
- If a membership helper function is needed, avoid recursive RLS queries and
  take function rights and a fixed `search_path` into account.

## Acceptance criteria

- Migrations can be applied in order to an empty Supabase project.
- Unauthenticated access and access by other users return no room data.
- RLS rights are also effective with the public client key.
- Constraints prevent invalid cards and double votes by the same identity.

## Verification and result

Implementation:

- `supabase/migrations/20261014090000_tables.sql`: tables, foreign keys, check constraints, indexes.
- `supabase/migrations/20261014090100_access_rights.sql`: RLS, rights, read policies.
- `docs/supabase-setup.md`: first setup (project, migrations, keys).

The membership test runs via `private.is_room_member` (SECURITY DEFINER, fixed
`search_path`, schema `private` not exposed via the API), so there is no
recursive policy. Composite foreign keys enforce that votes belong to the current
round of the same room and to a member of that room. When leaving, the vote
disappears automatically. `round_id` deliberately has no `ON UPDATE CASCADE`: a round switch must
delete the votes first (function in work package 006).

Verified locally (PostgreSQL 17 in Docker, Supabase roles `anon`/`authenticated` and
`auth.uid()` simulated; no test code checked in):

- Both migrations run in order without errors on an empty database.
- Invalid data is rejected: empty, untrimmed and too long name, second round per
  room, invalid status, invalid card, double vote, vote by a non-member
  person, vote with a round of another room, too short token. Cards `coffee` and `?` are allowed.
- Changing `round_id` with existing votes fails; after deleting the votes it works.
- `anon`: `permission denied` on all tables. A signed-in person sees only data of their
  room, a person without membership and a session without `sub` see nothing.
- `room_invites` is not readable for `authenticated`; INSERT/UPDATE/DELETE are rejected on all
  tables. Rights overview: only `SELECT` for `authenticated` on four
  tables, RLS active everywhere. The Supabase default rights were simulated for this.

Confirmed in the real Supabase project (in work package 004): as a signed-in anonymous person
without membership, all read accesses with the public key return 0 rows, `room_invites`
and all write accesses are rejected with `permission denied`.
