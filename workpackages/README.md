# Roadmap: Planning Poker MVP

## Goal and fixed scope

An English-language browser app accompanies your Teams meeting. The room link is shared in
the Teams chat; participants open it in the browser.

- React, TypeScript and Vite for the user interface.
- Cloudflare (Workers/Pages Free) for static hosting with a `workers.dev`/`pages.dev` address.
- Supabase Free for PostgreSQL, anonymous sign-in and realtime updates.
- Own accounts and own source code; no self-operated backend service.
- Reusable room links without automatic room deletion.
- Participation with a display name, without visible registration.
- Cards: `0`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `?`, `☕`.
- Votes are saved immediately and only hidden in the UI until the reveal.
  This is a deliberate fairness agreement, not technical secrecy.
- All room members may reveal and start new rounds.
- Each person only changes their own vote, as long as the round is open.
- Only the current round is stored; a new round replaces title and votes.
- Teams integration, automatic Teams identity, history and ticket integrations
  are not part of the MVP.

## Working method and quality

**Test code is only written when a concrete bug turns up.**
No precautionary test framework, no automatically generated tests and no TDD
for new features. A bug found is documented with reproduction, expected and
actual behavior. A targeted regression test may then be added if it is useful
to secure the fix.

Acceptance otherwise happens through code/SQL review, type check, lint, build and
manual functional checks. Checks involving several people use separate
browser profiles; two tabs of the same profile normally share one identity.

Each package is a small, functionally coherent step. It should be reviewable and
committable on its own. Dependencies must be met before completion.
Status and actual test results are added to the package during implementation.
External prerequisites are documented as blockers, not marked as done.

## Milestones and work packages

The status (Open, In progress, Done, Blocked) is maintained here and in the respective package. The numbering is the recommended
processing order; the Dependencies column lists the mandatory prior work.

| No. | Work package | Dependencies | Milestone | Status |
| --- | --- | --- | --- | --- |
| 001 | [Project scaffold](001-project-scaffold.md) | – | M1: Foundation | Done |
| 002 | [Data and action contract](002-data-and-action-contract.md) | – | M1 | Done |
| 003 | [Database schema and read access](003-database-schema-and-read-access.md) | 002 | M1 | Done |
| 004 | [Supabase connection and identity](004-supabase-and-identity.md) | 001 | M1 | Done |
| 005 | [Room access and membership](005-room-access-and-membership.md) | 003, 004 | M2: Shared room | Done |
| 006 | [Round switching and reveal](006-round-switching-and-reveal.md) | 005 | M2 | Done |
| 007 | [Saving and changing votes](007-saving-votes.md) | 006 | M2 | Done |
| 008 | [Create and join a room: user interface](008-room-ui.md) | 005 | M3: Playable flow | Done |
| 009 | [Cards and results: user interface](009-poker-ui.md) | 006, 007, 008 | M3 | Done |
| 010 | [Realtime synchronization](010-realtime.md) | 009 | M3 | Done |
| 011 | [Reconnecting and concurrent actions](011-reconnect-and-conflicts.md) | 010 | M4: Reliable use | Done |
| 012 | [Usability and error displays](012-usability.md) | 011 | M4 | Done |
| 013 | [Cloud setup and publishing](013-deployment.md) | 012 | M5: Usable MVP | Done |
| 014 | [Joint MVP acceptance](014-mvp-acceptance.md) | 013 | M5 | Done |
| 015 | [Compact room header and hierarchy](015-room-header-and-hierarchy.md) | 014 | M6: UX iteration 1 | Done |
| 016 | [Phases and "Estimate again"](016-phases-and-new-round.md) | 015 | M6 | Done |
| 017 | [Result distribution and result texts](017-result-display.md) | 015 | M6 | Done |
| 018 | [Feedback close to the action](018-local-feedback.md) | 015 | M6 | Done |
| 019 | [Leaving and removing participation](019-leave-and-remove-participation.md) | 016 | M7: UX iteration 2 | Done |
| 020 | [Participant status](020-participant-status.md) | 016 | M7 | Done |
| 021 | [Finding permanent rooms again](021-finding-rooms-again.md) | 015 | M7 | Done |
| 022 | [Room name](022-room-name.md) | 021 | M7 | Done |
| 023 | [Translation to English](023-english-translation.md) | 022 | M8 | Done |
| 024 | [Remove members from a room](024-remove-members.md) | 019, 020 | M9 | Done |

### M1: Foundation

The app builds successfully; data model and access model are defined and anonymous
sign-in works. A Supabase Free project is already needed for real database/auth checks.
Its first setup is recorded in 003 and 004 and later merged into a complete guide in 013.

### M2: Shared room

Room access, round switching and voting work via the database API.
Access by outsiders is excluded, concurrent actions are defined.

### M3: Playable flow

Two people can join via the user interface, vote, see changes live,
reveal and start a new round.

### M4: Reliable use

Reloading, connection loss and multiple tabs produce no double votes or
unnoticed loss of state. The app is usable on desktop and narrow views.

### M5: Usable MVP

The app is reachable via HTTPS, accepted with two separate identities and
can be deployed again using the guide from the repository.

### M6: UX iteration 1

In the meeting, a person recognizes within a few seconds: which story is being estimated,
which card they chose and what the next step is. The basis is a heuristic UX assessment;
real user behavior should additionally be observed.

### M7: UX iteration 2

Participant status, stable results when leaving and findable rooms. 019 and 020
needed product decisions beforehand.

### M8: English

The whole project (user interface, code comments, SQL comments, documentation, work packages
and file names) is in English.

### M9: Member management

Members can be removed from a room.

## Prerequisites and operating limits

- The project accounts are created and controlled by the user or team.
- The frontend only contains the Supabase project URL and publishable/anon key.
  Service role/secret keys and account credentials belong neither in the frontend nor in Git.
- Participants must be able to reach the websites of Cloudflare and Supabase.
- Supabase Free may pause after a week of inactivity. A permanently valid
  room link therefore does not guarantee uninterrupted availability; resuming
  in the dashboard is part of the operating guide.
- Free quotas and current platform requirements are checked at setup.
- The anonymous identity stays stored in the browser. Another profile/device or
  cleared browser data produce a new identity; names are not a login.
- Persistent rooms and memberships are not equated with transient online presence.
  Former participants must not block the new round as missing votes.

## Sources

- [Cloudflare Pages: Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Supabase: Free plan](https://supabase.com/pricing)
- [Supabase: anonymous sign-in](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
