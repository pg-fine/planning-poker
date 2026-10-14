# 012 – Usability and error displays

- **Status:** Done
- **Dependencies:** 011
- **Milestone:** M4

## Goal

Make the existing flow quickly understandable and easy to use in the meeting.

## Tasks

- Harmonize labels and error messages.
- Ensure keyboard operation, visible focus and labeled input fields.
- Mark the selected card and connection status with text/symbols in addition to colors.
- Check and adapt the layout on desktop and narrow browser windows.
- Display long titles/names and empty states without breaking the layout.
- Give clearly visible feedback on running actions, successful link copying and errors.
- Add a short notice: the same browser keeps the identity; a new device or
  cleared browser data mean a new participation.
- Display errors for a paused/unreachable Supabase project understandably,
  without wrongly diagnosing an unknown cause with certainty.

## Acceptance criteria

- Room access and estimation round are fully operable by keyboard.
- No essential action is recognizable only by color or hover.
- Narrow windows stay usable for core actions without horizontal scrolling.
- Errors give a sensible next action and do not delete user input unnecessarily.

## Verification and result

Changes:

- Running actions no longer disable buttons (`aria-disabled`, clicks are ignored,
  input fields `readOnly`): keyboard focus is kept. Real `disabled` only exists without a
  network. Buttons show "Saving …".
- Focus handling: after a page change (e.g. room created) and when the room is first shown, focus moves
  to the start of the content; after the reveal to the result, if focus
  would otherwise be lost.
- Contrast in dark mode: own text color on the accent (`--on-accent`), previously barely readable.
- Long words (names, titles, links) wrap and do not break the layout.
- Notice on identity in the footer: the browser keeps the participation; another device/browser or
  cleared browser data mean a new person.
- Network errors name possible causes (internet, paused free project, network block) without
  claiming any of them as certain.
- Already present: labels and error texts, labeled fields, card selection via
  the text "selected" and `aria-pressed`, connection status as text, copy feedback as text.

Verified in the browser (headless Chromium via Playwright, real Supabase project; no test code
checked in):

- Keyboard-only operation: type the name and create the room with Enter, title with Enter, Tab to the
  cards, select with the space bar (focus stays on the card), Tab to "Reveal
  cards", Enter reveals (focus afterwards on the result).
- Automatic accessibility check (axe-core, WCAG 2 A/AA and best practices) without findings
  on home page, open round, result, error state and in dark mode (incl. contrast).
- Error case (request aborts): message with "try again", entered title is kept.
- 320 px width with a 40-character name and 120-character title without spaces: no horizontal
  scrolling in the open round and result. No JavaScript errors. Type check, lint, build error-free.

Limits: only Chromium was tested. A real screen reader and the Teams browser environment
were not tested. Axe only finds part of the possible barriers.
