# 005 – Room access and membership

- **Status:** Done
- **Dependencies:** 003, 004
- **Milestone:** M2

## Goal

Make permanent rooms accessible via an invitation link and limit access.

## Tasks

- Implement database functions to create a room, join with a token and leave a room.
- Generate a cryptographically random invitation token with at least 128 bits of entropy.
- Perform room creation and the first membership in one transaction.
- Validate names on the server and keep membership unique per user/room.
- Make joining again idempotent and allow changing the name.
- Allow room members to copy the existing link without offering a public
  list of rooms or tokens.
- When leaving, remove membership and own current vote atomically;
  round and room are kept.
- For privileged SQL functions, check authentication and authorization explicitly,
  limit execution rights and use a fixed `search_path`.
- Provide typed frontend access functions.

## Acceptance criteria

- A link leads to the same room repeatedly; there is no automatic expiry.
- Invalid tokens create no membership and reveal no data of other rooms.
- Joining again with the same identity creates no duplicate.
- After leaving, direct room queries are blocked; joining again via the link works.

## Verification and result

Implementation:

- `supabase/migrations/20261014090200_room_access.sql`: `create_room`, `join_room`,
  `leave_room`, `get_invite_token` (SECURITY DEFINER, empty `search_path`, `auth.uid()`
  from the session, execution only for `authenticated`, not for `anon`) and the internal
  name check `private.normalize_display_name`.
- `src/supabase/rooms.ts`: typed functions `createRoom`, `joinRoom`, `leaveRoom`,
  `getInviteToken`, error codes as `RoomError` with messages.
- Invitation token: two random UUIDs without hyphens (64 hex characters, about 244 bits),
  so no extension (pgcrypto) is needed. The contract was adjusted accordingly.

Verified locally (PostgreSQL 17 in Docker, Supabase roles and `auth.uid()` simulated,
several users; no test code checked in):

- `anon` may not execute any of the functions; without a user ID in the session `not_authenticated`.
- Invalid names (empty, whitespace only, `null`, 41 characters) → `invalid_name`; whitespace at
  the edges is removed. Invalid or missing token → `invalid_token`, without revealing room data.
- Joining is idempotent: joining repeatedly creates no duplicate; a name change
  increases the room revision, an identical name does not (revision 1 → 2 → 3 → 4 on leaving).
- Twelve simultaneous joins by the same person with changing names: no error, exactly one
  membership (room lock).
- Other people get `not_member` for token and leaving, also for non-existent rooms.
- Leaving removes membership and own vote; room, round and other people's votes stay.
  Afterwards room queries and token are blocked; joining again via the link works, the old
  vote does not come back. Direct write access and `room_invites` stay blocked.
- Type check, lint and build are error-free.

Confirmed in the real Supabase project: all migrations are applied. A complete flow
with three anonymous identities via the app's TypeScript modules (create room, join,
token, round, vote and change, reveal, new round, conflicts, leave and rejoin,
outsider without access, direct write access blocked) ran with 21 of 21 checks
without errors. A test room was created in the project (without meaning).
