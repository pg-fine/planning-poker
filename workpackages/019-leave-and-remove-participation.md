# 019 – Separate "Back to home" from "Remove participation"

- **Status:** Done
- **Dependencies:** 016
- **Milestone:** M7: UX iteration 2
- **Origin:** UX assessment (point 6), priority high, effort medium

## Goal

Someone who leaves after the meeting does not thereby change a revealed result.

## Decision

This changes a deliberate product rule: so far "Leave room" also removed the own vote,
even after the reveal (see MVP acceptance, scenario 10). Before implementation the
client had to confirm the new rule.

## Tasks (after confirmation)

- "Back to home" only ends the view, without changing data.
- "Remove participation" as an explicit, confirmed action that changes data.
- Revealed results stay stable until the next round starts; removing then only affects
  open rounds (check adjustment in migrations/RPC).
- Update `docs/data-and-action-contract.md` and `docs/identity.md`.
- Adjust scenario 10 of the acceptance.

## Acceptance criteria

- Leaving after the reveal does not change the result.
- "Remove participation" is clearly named and requires confirmation.
- Data isolation and rights (003) are kept; schema change documented.

## Verification and result

Implemented (without a database change):

- "Back to home" (link in the room header) only leaves the view; membership and vote
  stay, the room stays in "Recently used rooms".
- "Remove participation" (under "Room and help") calls `leave_room` as before, now with
  confirmation ("Really remove your participation? ...") and with a notice on what happens to the vote.
- `docs/data-and-action-contract.md` extended.

Verified (headless Chromium via Playwright, two separate profiles, real Supabase project): the home page
leaves vote and membership unchanged (second person sees 1 vote, 2 members); returning
via the list shows the saved vote; Cancel leaves everything; "Yes, remove" leads to the
home page, the second person sees 1 member and 0 votes; axe-core without findings.

Database (migration `supabase/migrations/20261014090600_stable_results.sql`):

- The foreign key `votes_member_fkey` (cascade) is dropped; new column `votes.voter_name`.
- `leave_room`: in an open round the vote is deleted (as before). In a revealed
  round it is kept together with the name (`voter_name`) until the next round starts.
- For such votes the snapshot additionally delivers `display_name`; `RevealedResults` uses it
  if the person is no longer in the member list.
- Privacy: the name of a person who removes their participation after the reveal stays visible in the
  result until the next round starts (the notice is in the user interface).
- The app also works before the migration is applied (then as before: the vote disappears).

Verified: migrations 1-8 were applied one after another in a local PostgreSQL 16 database (Docker, with a replica of
`auth.uid()` and the roles) and the functions were played through with two users:
removing in an open round deletes the vote; removing after the reveal keeps
vote and name in the other person's snapshot; member count drops; the next round deletes all
votes; non-members see nothing. The user interface was checked with a simulated response
(browser interception of the snapshot response), since the migration was not yet applied
in the real project: a vote with `display_name` appears with the name in the result.
After applying the migration (14.10.2026), verified against the real Supabase project (headless Chromium,
two separate profiles): removing in an open round deletes the vote (other person sees 1 vote);
removing after the reveal leaves "Ben · 8" in the other person's result; "Estimate
again" cleans up (0 votes); axe-core without findings.
