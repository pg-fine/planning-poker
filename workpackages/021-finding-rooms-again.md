# 021 – Finding permanent rooms again

- **Status:** Done
- **Dependencies:** 015
- **Milestone:** M7: UX iteration 2
- **Origin:** UX assessment (point 5), priority medium, effort medium

## Goal

Fewer unnecessary new rooms and less searching for the right Teams link.

## Tasks

- Optional room name when creating: moved to 022, because it needs a database change.
- Home page: "Recently used rooms", stored locally in the browser (`src/ui/storage.ts`),
  fault-tolerant when storage is blocked.
- "Change name" in the room.
- Entry removable; do not store personal data beyond the display name.

## Acceptance criteria

- Recently visited rooms appear after reloading and lead to the right room.
- Without available local storage the home page stays functional.
- Type check, lint, build; manual check.

## Verification and result

Changes:

- `src/ui/storage.ts`: list "recently used rooms" (at most 10; token, last visit, own
  name; browser only). Broken or blocked storage leads to an empty list.
- Home page (`HomePage.tsx`): section "Recently used rooms" with link, time, own name
  and "Remove" (only deletes the list entry). The section only appears if there are entries.
- Entries are updated when creating, joining and opening a known room.
- "Change name" (`NameChange.tsx`, under "Room and help"): uses `join_room` with the same token; the
  membership stays, only the name changes. No database change needed.
- Without a room name an entry is called "Room …" plus the last six characters of the token.

Verified (headless Chromium via Playwright, two separate profiles, real Supabase project, no
test code checked in): new home page without a list; create room, second person joins;
renaming becomes visible for the other person; the list shows the room with the new name, the link opens
the room; "Remove" clears the entry; axe-core without findings. Type check, lint, build error-free.
Not verified: blocked local storage in the browser.
