# 018 – Feedback close to the action

- **Status:** Done
- **Dependencies:** 015
- **Milestone:** M6: UX iteration 1
- **Origin:** UX assessment (point 7), priority medium, effort small

## Goal

Save status and errors appear where the action took place.

## Tasks

- Show saving directly at the card selection; afterwards briefly "Your estimate: 8 · saved".
- Do not set several buttons to "Saving …" at the same time.
- Voting errors at the cards, title errors at the title field.
- Technical explanations (browser ID, Supabase) behind "Help" (coordinate with 015).
- Keep focus and `aria` behavior from 012; status messages for screen readers (`aria-live`).

## Acceptance criteria

- A voting error never appears at the form for the next round and vice versa.
- Inputs are not lost on errors.
- Type check, lint, build; manual check including a simulated network error.

## Verification and result

Changes (`RoundPanel.tsx`, `cards.ts`):

- Running actions and errors are separated by area (`vote`, `reveal`, `start`): only
  the button of the affected area shows "Saving …" or "Revealing …"; during an
  action the other actions stay blocked as before.
- At the card selection, directly below the cards, "Saving your estimate: 8 …" and then
  "Your estimate: 8 · saved" (`role="status"`) appear.
- Voting errors appear below the cards, reveal errors below "Reveal cards", title errors
  directly at the title field (`aria-invalid`, `aria-describedby`). The shared error block at the end is removed.
- `cardDescription` from the result view is now in `src/domain/cards.ts` and is also used for
  the status message.
- Technical notices on browser ID/identity have been behind "Help" since 015.

Verified (headless Chromium via Playwright, real Supabase project, no test code checked in):
empty title → error at the title field; card selection → "Your estimate: 8 · saved"; with aborted
requests, voting and reveal errors appear at the respective place, the selection is kept;
axe-core without findings. Type check, lint, build error-free.
Open: error messages still mention "Supabase" (technical term, but only in the error case).
