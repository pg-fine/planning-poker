# 016 – Phase-dependent actions and "Estimate again"

- **Status:** Done
- **Dependencies:** 015
- **Milestone:** M6: UX iteration 1
- **Origin:** UX assessment (point 2), priority high, effort medium

## Goal

The flow is divided into three clear phases with one main action each. The "New round"
form no longer competes with a running vote.

| Phase | Main action |
| --- | --- |
| No round yet | Start estimate |
| Voting in progress | Choose a card, then reveal |
| Result visible | Next story |

## Tasks

- Derive the phase from the existing round status; only highlight the matching main action.
- Take back "New round" during a running vote (e.g. as a secondary action).
- "Estimate again": start the same story again with the same title, without entering the title
  again. Check whether the action contract (002) must be extended for this or whether the
  client can use the existing action "start round" with the old title.
- When replacing a running round with existing votes, ask for confirmation:
  "Replace the running vote? The votes cast so far will be removed."
- Keep handling concurrent actions (011) correctly.

## Acceptance criteria

- In every phase exactly one main action is clearly recognizable.
- "Estimate again" removes the old votes and takes over the title.
- A running vote with votes is not replaced without confirmation.
- Type check, lint, build; manual check with two separate browser profiles.

## Verification and result

Changes (`RoundPanel.tsx`):

- Phase "No round yet": only "Start the first round" with a title field.
- Phase "Voting in progress": cards and "Reveal cards" are the main action. The option to start
  another story is collapsed under "Estimate a different story instead" and
  displayed as secondary.
- Phase "Result visible": section "Next story" with "Start next story" (main action)
  and "Estimate again".
- "Estimate again" uses the existing action "start round" with the title of the current
  round. The action contract (002) did not need to be extended; conflict handling and the check
  "was the action applied?" (011) apply unchanged.
- When replacing a running round with votes, the confirmation "Replace the running vote?
  The votes cast so far will be removed." appears with "Yes, replace" and "Cancel". Without
  votes it is replaced directly. The confirmation only applies to the round for which it was asked.

Verified (headless Chromium via Playwright, two separate browser profiles, real Supabase project,
no test code checked in): create room, start round, second person joins; confirmation
appears with votes, Cancel leaves the round unchanged; reveal shows "Next story" and
"Estimate again"; the latter starts the same story with 0 votes for the other person;
replacing without votes happens without confirmation. Type check, lint, build error-free.
Not verified: simultaneous actions of both people in exactly this flow (logic unchanged from 011).
