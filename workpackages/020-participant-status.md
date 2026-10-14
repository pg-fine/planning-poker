# 020 – Participant status "voted / still open"

- **Status:** Done
- **Dependencies:** 016
- **Milestone:** M7: UX iteration 2
- **Origin:** UX assessment (point 3), priority high, effort medium (larger with presence)

## Goal

The question "Are we still waiting for someone?" can be answered without revealing card values beforehand.

## Decision (made by the client)

Estimating group = members who are currently online in the room (presence). Details below.

Original question:

The member list also contains people from earlier sessions. This must not produce a progress like
"3 of 12" (see README, operating limits). It has to be clarified who belongs to the current estimating group,
e.g. explicitly participants of this round. Online presence alone does not say whether someone
is estimating or watching.

## Tasks (after the decision)

- Record the definition of the estimating group in `docs/data-and-action-contract.md`.
- Show people with initials and a neutral status (✓ voted / no vote yet); values
  stay hidden.
- Progress display "x of y voted" only based on the defined group.
- If necessary, extend schema, read rights and realtime (003, 010).

## Acceptance criteria

- Former members produce no missing votes in the progress display.
- Status is not recognizable by color alone.
- Type check, lint, build; check with at least two separate profiles.

## Verification and result

Changes:

- `useRoomState.ts`: a separate presence channel `presence:<room_id>` with a shared name (the data channel
  has a unique name per tab and is unsuitable for this); only the user ID is transmitted.
  Result: `onlineIds` (`null` while unknown).
- `Participants.tsx` replaces the member list: heading "Online (n)", initials, per person
  "✓ voted" or "no vote yet" during an open round, progress
  "x of y voted" only over the online members. Members who are not online are collapsed
  under "Not online (n)" and only show a check mark if they voted. Without a live connection
  the display falls back to the member list without progress.
- Card values stay hidden until the reveal. Status is text (not only color).
- `docs/data-and-action-contract.md`: section "Presence", including limits.
- No database change needed.

Verified (headless Chromium via Playwright, three separate profiles, real Supabase project):
3 online, 0 of 3; after Ben's vote 1 of 3; after closing Ben's window 0 of 2 and Ben
under "Not online" with "✓ voted"; axe-core without findings. Type check, lint, build error-free.
In the first attempt everyone only saw themselves: the presence channel shared the unique
channel name of the data channel; fixed by the separate channel.
Limits: the channel is not private (see contract). Presence does not distinguish between estimating people
and people just watching. Briefly dropping out (tab switch, connection loss) makes people briefly appear as "not online".
Not verified: React development mode (strict mode) with a double effect run; production build verified.
