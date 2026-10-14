# 007 – Saving and changing votes

- **Status:** Done
- **Dependencies:** 006
- **Milestone:** M2

## Goal

Store exactly one valid vote per identity for the open current round.

## Tasks

- Implement a database function for casting a vote with room/round ID and card value.
- Derive the user ID from the auth session, not from freely passed parameters.
- Check membership, current round ID, open status and card value.
- Update an existing own vote instead of inserting further votes.
- Coordinate casting a vote with reveal/round switch via the same locking strategy.
- Allow reading all votes only for room members; values are deliberately delivered
  before the reveal and hidden later by the UI.
- Add frontend access with typed results and business errors.

## Acceptance criteria

- A second selection replaces the first; the number of votes stays the same.
- Votes for old or revealed rounds are rejected.
- Other people's votes cannot be changed, not even by direct API calls.
- Simultaneous reveal and voting has a consistent result:
  vote accepted before the reveal or rejected after the reveal.

## Verification and result

Implementation:

- `supabase/migrations/20261014090400_votes.sql`: `cast_vote(room_id, round_id, card)`.
  User ID only from the session. Order of checks: membership, card, round present,
  round ID current, round open. Upsert on (room, person); sending the same card again changes nothing.
- `src/supabase/votes.ts`: `castVote` with typed `CardValue`.
- Reading all votes for members happens via the snapshot (and RLS from 003). The values
  are deliberately delivered before the reveal; the user interface hides them (009).

Verified locally (PostgreSQL 17 in Docker, several users; no test code checked in):

- Invalid cards (`4`, `null`, `coffee ` with a space) → `invalid_card`; other people's and
  unknown rooms → `not_member`; `anon` has no execution right.
- A second selection replaces the first, the number of votes stays the same. Sending a card again
  changes neither revision nor vote; real changes increase the revision by 1.
- Special cards `?` and `coffee` are stored.
- Other people's votes can neither be changed, inserted nor deleted by direct access.
- After the reveal → `round_not_open`, votes unchanged. After a round switch → `round_conflict`
  for the old round ID, the new round stays empty.
- Leaving removes the own vote.
- Six simultaneous votes by the same person plus a simultaneous reveal: exactly one
  vote remains; votes accepted before the reveal are valid, one arriving afterwards
  gets `round_not_open`.
- Type check and lint are error-free.

Confirmed in the real Supabase project: all migrations are applied. A complete flow
with three anonymous identities via the app's TypeScript modules (create room, join,
token, round, vote and change, reveal, new round, conflicts, leave and rejoin,
outsider without access, direct write access blocked) ran with 21 of 21 checks
without errors. A test room was created in the project (without meaning).
