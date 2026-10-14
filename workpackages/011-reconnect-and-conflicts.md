# 011 – Reconnecting and concurrent actions

- **Status:** Done
- **Dependencies:** 010
- **Milestone:** M4

## Goal

Keep a traceable state during network problems and simultaneous use.

## Tasks

- Load the current state after reconnect and after returning to a long-inactive tab.
- Make connection loss recognizable and block mutations when the offline situation is known.
- Do not silently display failed actions as successful.
- On an unclear response, reconcile the state first; do not blindly create new rounds again.
- On version/round conflicts, update and understandably prompt to act again.
- Treat multiple tabs of the same identity as one vote; reconcile the stored selection.
- Do not display the membership list as a current online list or a list of mandatory voters.
- Connection loss keeps stored votes; deliberate leaving uses the
  deletion rules from 005 and updates other views.

## Acceptance criteria

- An offline/online change restores the current round state without manual reloading.
- After a round switch in the meantime, no old selection is carried into the new round.
- Multiple tabs produce no double votes.
- Two simultaneous new rounds or a reveal during voting lead to
  consistent displays and traceable conflict messages.

## Verification and result

Implementation:

- `useRoomState`: additionally loads the state on "network back" (`online`) and on returning
  to the tab (`visibilitychange`). The browser's network status flows into the connection display.
  Without a live channel (e.g. WebSockets blocked in a corporate network) the app polls every 5 seconds
  as long as the tab is visible.
- `RoundPanel`: actions are only blocked when there is no network, not already when the
  live channel has failed. On an unclear response (connection dropped) nothing is ever repeated blindly: the state
  is loaded and it is checked whether the action is visible there (vote, new round with this title,
  revealed). If so, it counts as successful, otherwise a clear message appears.
- `RoomView`: status texts for "live", "no live connection (polling mode)" and "no connection"
  (actions paused, saved vote is kept).
- Conflict messages (`round_conflict`, `round_not_open`) reload the state, as in 009.
- Multiple tabs: the chosen card always comes from the stored state, never from local
  memory. Therefore no old selection migrates into a new round.

Verified in the browser (headless Chromium via Playwright, several profiles, real Supabase project;
no test code checked in):

- Network off: notice appears, cards and reveal blocked, saved selection stays
  visible. Meanwhile another person reveals and starts a new round; after the network
  is on again the new round appears without reloading and without the old selection.
- Vote, new round and reveal with a lost response (request arrived): no error, correct
  state, for the new round no second round and the input is cleared.
- Request did not arrive: message "did not arrive", previous vote stays.
- Two tabs of the same identity: the selection is adopted live and they replace each other,
  number of votes 1, members unchanged.
- WebSocket blocked: notice "No live connection", actions stay usable, changes
  appear after about 5 seconds, voting works.
- No JavaScript errors. Type check, lint and build are error-free.

Addendum (when checking the published app): a single run did not show a live update,
four further runs were error-free. As a safeguard the app now also reconciles the state every
30 seconds with a live channel. Verified by discarding all live events in the browser: the
change appears after at most 30 seconds. The exact cause of the one-time failure is not
proven.

Not verified: returning to a tab sleeping in the background (only secured by code) and
real connection drops in the middle of the realtime channel (only via network emulation).
