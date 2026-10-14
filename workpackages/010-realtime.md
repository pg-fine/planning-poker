# 010 – Realtime synchronization

- **Status:** Done
- **Dependencies:** 009
- **Milestone:** M3

## Goal

Transfer changes to the round and votes to all room views without manual reloading.

## Tasks

- Add the required tables selectively to Supabase Realtime; record the setup as SQL or as
  traceable dashboard steps.
- Register subscriptions per room and clean them up when switching/leaving.
- Treat the database as the authoritative state; events trigger bundled reloading.
- Reliably detect vote deletions and round switches too, for example
  via a room revision updated in the same operation.
- After a successful subscribe, load a current snapshot so that no change is lost between
  the initial load and the subscription.
- Ignore stale responses with overlapping load requests.
- Provide a connection status and avoid unnecessary multiple subscriptions.

## Acceptance criteria

- Two profiles see the number of votes, reveal and new round without reload.
- Joining during a running round shows its complete current state.
- Leaving and switching rooms leave no active listeners of the old room behind.
- Events and reload requests do not release data of other rooms.

## Verification and result

Implementation:

- `supabase/migrations/20261014090500_realtime.sql`: adds only `public.rooms` to the publication
  `supabase_realtime` (idempotent). The table contains neither names nor votes; the
  read policy from 003 (members only) also applies to realtime events.
- `src/ui/useRoomState.ts`: subscribes to UPDATE events of the own room row
  (`id=eq.<roomId>`, channel name with a random part). Every event and every (repeated)
  `SUBSCRIBED` reloads the snapshot via `get_room_state`. Overlapping requests are
  merged, states with an older revision are discarded. Cleanup via `removeChannel`.
- The connection status (`connecting`, `live`, `offline`) is displayed in `RoomView` as text.
- Uses the existing room revision: leaves, round switches and deleted votes
  are thereby reliably detected (there are no deleting events).

Verified without the migration (real project, headless Chromium): the channel connects and the
display shows "Live", but as expected no events arrive. This confirms
that the migration is necessary.

Verified after applying the migration in the real project (three profiles, no test code checked in):

- Join, new round, number of votes, reveal, new round (without old votes) and leaving
  appear for the others without reloading. On leaving, member and vote counts drop live.
- A late join during a running round shows the current state.
- Outsiders receive no events of a room they do not belong to.
- Every opened channel is closed again when leaving the room (`phx_leave`).
- Other people's card values do not appear before the reveal even live. No JavaScript errors.
