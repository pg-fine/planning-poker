# 017 – Result distribution and more precise result texts

- **Status:** Done
- **Dependencies:** 015
- **Milestone:** M6: UX iteration 1
- **Origin:** UX assessment (point 4), priority high, effort small to medium

## Goal

The revealed result is the starting point for the discussion: differences in the estimates
are recognizable at a glance.

## Tasks

- Distribution as a simple bar display (value, bar, count "3 votes"/"1 vote");
  bars additionally readable as text/number, not only graphically.
- Below it, people and their values stay visible.
- Display the average as secondary, not as a recommended final estimate.
- Make "agreement" more precise (logic in `src/domain/results.ts`):
  - All number votes equal: "All estimates cast are at 5."
  - Only `?`: "All votes cast: still unclear."
  - Only `☕`: "All votes cast: coffee break."
- Do not count special cards as agreement on the effort.
- Edge cases: no votes, one vote, mix of numbers and special cards.

## Acceptance criteria

- Identical special cards produce no statement about agreement on the effort.
- Bars have high contrast in light and dark mode and are labeled for screen readers.
- Type check, lint, build; manual check of the edge cases.

## Verification and result

Changes:

- `src/domain/results.ts`: new function `describeAgreement` delivers the precise statements
  ("All estimates cast are at 5.", "… still unclear.", "… coffee break."); with fewer
  than two votes or mixed votes there is no statement.
- `src/ui/RevealedResults.tsx`: section "Distribution" with bars, card value and text "n vote(s)"
  (bars `aria-hidden`, the count is always given as text; special cards in a neutral color), below it
  "Who chose what?". The average is secondary as "Calculated average … only a rough
  guide".

Verified (headless Chromium via Playwright, two separate profiles, real Supabase project, no
test code checked in): mixed votes (5/8), same number, only `?`, only `☕`, `?` with a number; 1000 px
light and 320 px dark without layout break; axe-core without findings. Type check, lint, build error-free.
Not verified: very many different cards at the same time, revealed round without votes in the browser.
