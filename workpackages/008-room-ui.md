# 008 – Create and join a room: user interface

- **Status:** Done
- **Dependencies:** 005
- **Milestone:** M3

## Goal

Make room access fully possible via the browser interface.

## Tasks

- Build a home page with name input and the action "Create room".
- Define the URL concept for invitation links and implement joining through it.
- Pre-fill the name in the browser, but have it confirmed before the first join.
- Create a room view with "Copy link" and "Leave room".
- If the clipboard is blocked, show a link that can be copied manually.
- Display empty/too long names, invalid links, loading states and API errors.
- After reloading a known room, restore membership and current data.
- Prevent double clicks during running actions.

## Acceptance criteria

- A person can create a room and give its link to a second person.
- The second person joins with their own name.
- Invalid links show a helpful message with a way back to the home page.
- Leaving leads to the home page without invalidating the room link.
- Direct access and reloading of an invitation link work locally.

## Verification and result

Implementation:

- Router without a library (`src/ui/routing.ts`, `Link.tsx`): `/` home page, `/r/<token>`
  room link (64 hex characters), invalid links and unknown addresses with a way back to the home page.
  On Cloudflare, direct requests to `/r/...` must fall back to `index.html` (package 013).
- `HomePage` (create room), `RoomPage` (join form or direct entry),
  `RoomView` (copy link, member list, leave room), `NameField`.
- `src/ui/storage.ts` remembers name and invitation token → room ID of this browser (not
  sensitive, storage may be missing). A remembered room without membership (e.g. new
  identity) leads back to the join form instead of an error.
- Double-click protection on all actions; errors via `describeRoomError`.

Verified in the browser (headless Chromium via Playwright outside the project, two separate
browser profiles, real Supabase project; no test code checked in):

- Create room (empty name → error), link `/r/<64 hex>` is in the address bar.
- Reloading opens the room without joining again. A second profile joins via the link
  (double click harmless), both see 2 members.
- Invalid link (`/r/too-short`) and a well-formed, unknown token show the message;
  "Back to home" works. An unknown address shows "Page not found".
- Copy link: without permission the notice appears with the link selected, with permission
  the link is on the clipboard.
- Leaving leads to the home page; the same link stays valid, the name is pre-filled;
  joining again works. A new identity with a remembered room leads to the join form.
- Narrow view (380 px) without horizontal scrolling; no JavaScript errors.
- Type check, lint and build are error-free.

During checking some test rooms and anonymous test users were created in the Supabase project (without meaning).
