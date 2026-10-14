# 006 – Round switching and reveal

- **Status:** Done
- **Dependencies:** 005
- **Milestone:** M2

## Goal

All members can start a round consistently and reveal it manually.

## Tasks

- Provide database functions for a new round and for revealing.
- Validate membership and title on the server.
- On a new round, generate a fresh round ID and remove old votes/round data.
- Perform the replacement in one transaction and coordinate concurrent mutations through
  locks and a check of the expected round ID.
- Apply a reveal only to the expected current round; answer repeated reveal
  of the same round without further state change.
- A round without votes may also be revealed manually.
- Translate business conflicts into structured errors for the user interface.

## Acceptance criteria

- A round switch removes old votes completely and opens the new voting.
- Two simultaneous round switches with the same expected ID do not silently replace
  the round just created; only one is accepted.
- A late reveal of the previous round does not reveal the new round.
- All members have the same rights, outsiders have no control rights.

## Verification and result

Implementation:

- `supabase/migrations/20261014090300_rounds.sql`: `start_round`, `reveal_round`,
  `get_room_state` and internally `private.lock_room_as_member` (check membership, lock room
  row, check again) and `private.room_snapshot` (a single SQL statement so the
  snapshot is consistent).
- `src/supabase/rounds.ts` (`startRound`, `revealRound`), `src/supabase/roomState.ts`
  (`getRoomState`, validated types `RoomState`), `src/domain/cards.ts` (card set).

Verified locally (PostgreSQL 17 in Docker, several users; no test code checked in):

- First round: title is trimmed, title empty/`null`/121 characters → `invalid_title`;
  `start_round` with `expected = null` although a round already exists → `round_conflict`.
- A new round with the correct expected ID removes all votes, assigns a new `round_id`, status
  `open`. A second click with the old ID → `round_conflict`, the newer round stays.
- Eight simultaneous `start_round` with the same expected ID: exactly one wins, seven
  get `round_conflict`.
- Reveal: only works for the given round. Repeated reveal leaves state and
  revision unchanged. A late reveal of the old round does not reveal the new one.
  Without a round `no_round`. Reveal and round switch at the same time end in a consistent state.
- Other people and unknown rooms get `not_member` everywhere; `anon` has no execution right.
- The snapshot contains `me`, members, round including votes and revision. The frontend parses it
  strictly (invalid card is rejected). Type check and lint are error-free.

Confirmed in the real Supabase project: all migrations are applied. A complete flow
with three anonymous identities via the app's TypeScript modules (create room, join,
token, round, vote and change, reveal, new round, conflicts, leave and rejoin,
outsider without access, direct write access blocked) ran with 21 of 21 checks
without errors. A test room was created in the project (without meaning).
