# 015 – Compact room header and clear hierarchy

- **Status:** Done
- **Dependencies:** 014
- **Milestone:** M6: UX iteration 1
- **Origin:** UX assessment (point 1), priority high, effort small to medium

## Goal

The current estimate is at the center. Room management and technical notices step
back so that little scrolling is needed in a narrow browser window next to Teams.

## Tasks

- Compact header: room, own name, "Invite" (copy link).
- The current estimate as the central work area.
- Participants next to the estimate on wide screens, below it on narrow ones.
- Collapse the room link management, leave action and technical notices (browser ID, Supabase)
  or move them behind "Help".
- Replace the connection text in normal operation with "● Live"; detailed notices only on problems.
- Keep the existing usability from 012 (focus handling, text instead of color only, wrapping of long texts).

## Acceptance criteria

- At 320 px and 1280 px width the estimate and main action are reachable without searching.
- No horizontal scrolling; keyboard operation and focus as before.
- Connection problems stay clearly recognizable, not only by color.
- Type check, lint and build error-free; manual check in light and dark mode.

## Verification and result

Changes:

- Compact header (`RoomView.tsx`): "You are taking part as …", connection status "● Live" and "Invite"
  (copies the link; if the clipboard is blocked, "Room and help" opens and selects the link).
- Two-column layout from 40 rem: estimate on the left, members on the right; below each other in narrow windows.
- Invitation link, notice on leaving and the leave action are collapsed under "Room and help".
- The notice on browser ID and identity in the footer is collapsed behind "Help on browser and participation".
- Connection status: in normal operation only "● Live"; "○ Connecting …" or
  "▲ No live connection" with a detailed notice in a notice box only on problems.
- The phase logic (form "New round" only when sensible) follows in 016.

Verified (headless Chromium via Playwright, real Supabase project, no test code checked in):
create room, start round, select card at 1280 px (light), 320 px (light) and 1000 px (dark):
no horizontal scrolling, no JavaScript errors. axe-core (WCAG 2 A/AA, best practices) without
findings in light and dark mode, also with expanded help areas. Type check, lint and build
error-free. The offline notice box was not checked visually.

Note: the checks created some test rooms in the Supabase project.
