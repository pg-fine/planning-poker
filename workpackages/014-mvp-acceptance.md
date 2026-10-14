# 014 – Joint MVP acceptance

- **Status:** Done (accepted by the client)
- **Dependencies:** 013
- **Milestone:** M5
- **External prerequisite:** Two separate browser identities, preferably two people

## Goal

Accept the published MVP in a realistic planning poker flow.

## Manual acceptance scenarios

1. Create a room, share the link in the Teams chat and join with a second name.
2. Enter a story title; choose different cards and change the own selection.
3. Before the reveal other people's values stay hidden; the number of votes is correct live.
4. Reveal by the second person; names, number values and special cards appear correctly.
5. Start a new round; previous title and votes are replaced, no history is retrievable.
6. Close all browsers and open the same room link later; room and current round remain.
7. Join during a round, reload and open an additional window of the same identity.
8. Interrupt the connection, switch the round in the other session and reconnect.
9. Trigger new round/reveal/voting almost simultaneously; states stay consistent.
10. Leave deliberately and join again via the link; the own removed vote stays removed.
11. Create a second room; neither its data nor changes appear in the first room.
12. Manually try other people's room queries and changes to other people's votes via the client;
    they must be rejected. Do not use a service role key for this check.

## Tasks

- Run type check, lint and production build with the final states.
- Record date, browser, profiles involved, build/commit state and results.
- Capture bugs with reproduction and expected/actual behavior and fix them.
- **Write test code only for concretely noticed bugs**, if a targeted
  regression test makes sense; do not create a blanket test suite afterwards.
- After fixes, check the affected scenarios again.
- Finish a short usage guide for room link, card selection, reveal and new round.

## Acceptance criteria

- All scenarios are recorded as successful; open points are visibly documented.
- No open errors prevent room access, voting, reveal or data isolation.
- Project commands are successful; any existing bug regression tests as well.
- The team can run a complete estimation round with the guide without developer tools.

## Verification and result

**Acceptance on 14.10.2026** by the client (Peter Gruszka) on the published app
https://planning-poker.peter-gruszka.workers.dev. Feedback: "The software is accepted.
Looks great." The acceptance was given verbally in the chat; a scenario-by-scenario log of the
manual execution by the team does not exist. No anomalies were reported.

Own checks before the acceptance (headless Chromium via Playwright, separate browser profiles,
real Supabase project, no test code checked in). Scenarios 1-12 are thereby covered as follows:

| No. | Scenario | Verified in |
| --- | --- | --- |
| 1 | Create room, share link, join | 008, 013 (published app) |
| 2 | Title, select and change cards | 009 |
| 3 | Other people's values hidden, number of votes live | 009, 010, 013 |
| 4 | Reveal by second person, result | 009, 010 |
| 5 | New round replaces title and votes | 009, 010 |
| 6 | Open room link again later | 008, 013 (reload on `/r/<token>`) |
| 7 | Join during the round, reload, second tab | 010, 011 |
| 8 | Interrupt connection, round switches | 011 (network emulation) |
| 9 | Simultaneous actions | 006, 007 (SQL, 8 parallel calls), 011 |
| 10 | Leave and join again | 005, 008 (since 019: vote is only removed in an open round) |
| 11 | Second room stays separate | 003, 005, 010 (outsiders see nothing, no events) |
| 12 | Other people's queries and changes rejected | 003, 004, 005-007 (public key, `permission denied`/`not_member`) |

Project commands at the time of acceptance: `npm run typecheck`, `npm run lint` and `npm run build`
are error-free. There is no test code because no bug turned up that would have required a
regression test. The only conspicuous error (a live update that failed once) is documented in package 011
and secured with a reconciliation every 30 seconds; its cause is not proven.

Known limits of the MVP:

- Participation is bound to the browser. Another device or cleared browser data mean
  a new participation; an old entry stays as a member but blocks nothing.
- No history, no ticket integration, no Teams app (deliberately not in the MVP).
- Other people's card values are only hidden in the user interface before the reveal, but technically retrievable for
  members (deliberate decision).
- Supabase Free pauses after about a week of inactivity; for reactivation see `docs/deployment.md`.
- Only Chromium was tested; a real screen reader and the Teams environment were not tested.
