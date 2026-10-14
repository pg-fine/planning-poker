# 009 – Cards and results: user interface

- **Status:** Done
- **Dependencies:** 006, 007, 008
- **Milestone:** M3

## Goal

Make a complete estimation round playable through the user interface.

## Tasks

- Let the user enter a title and start the first/a new round.
- Display Fibonacci cards including `?` and `☕` as selectable buttons.
- Mark the own selection; allow further selection until the reveal.
- Before the reveal, show only the number of votes cast and the own card.
- Offer the reveal to all members; afterwards display card values with names.
- Display special cards without a numeric average calculation.
- Display an empty round and a round without an own vote sensibly.
- Only display actions as saved after the database success is confirmed.
- After each own mutation, load the current state; realtime follows in 010.

## Acceptance criteria

- Title, selection, changing the selection, reveal and new round are possible without an API console.
- Other people's cards do not appear before the reveal as visible text, tooltip or
  screen reader label; technical readability of the data is deliberately accepted.
- After the reveal the selection is locked; a new round shows no old votes.
- Names and titles are rendered as text, not as HTML.

## Verification and result

Implementation:

- `RoundPanel` (start round, cards, reveal, new round), `CardDeck` (card selection with
  `aria-pressed` and the text "selected"), `RevealedResults` (names with cards, distribution, agreement),
  `src/domain/results.ts` (evaluation; average only over number cards, special cards do not count).
- `useRoomState` adopts states from own actions and discards those with an older revision.
- Only confirmed database responses are displayed (no optimistic display).
  After `round_conflict`/`round_not_open` the view reloads the current state and says so.
- Before the reveal the user interface only shows the number of votes and the own card. Other
  people's card values are not in the DOM (text, labels, tooltips). Technically they remain
  retrievable for members (deliberate decision). The number "Votes cast" is not a list of mandatory voters.
- Titles and names are rendered as text.

Verified in the browser (headless Chromium via Playwright outside the project, two separate
profiles, real Supabase project; no test code checked in):

- First round: empty title → error; title `<b>STORY-1</b> Login` appears as text.
- Select and change a card (8 → 13): exactly one card selected, number of votes stays 1.
- The second person sees the round and the number of votes, but not the first person's card.
- Reveal: names with cards (incl. `☕`), distribution, average of the number cards only;
  afterwards no card selection any more. Reveal without votes: "Nobody voted."
  Identical cards: notice of agreement. Reloading after the reveal keeps showing the result.
- New round: no old votes, nothing selected. Stale view (still without live update):
  a vote after the reveal and a second round start give the matching message and update.
- Narrow view (380 px) without horizontal scrolling; no JavaScript errors.
- Type check, lint and build are error-free.

Known and planned for later packages: other people only see changes after
reloading or an own action (010 realtime); a retry after connection problems and
conflict refinement follow in 011.
