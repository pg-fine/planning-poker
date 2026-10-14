# 024 – Remove members from a room

- **Status:** Done
- **Dependencies:** 019, 020
- **Milestone:** M9: Member management

## Goal

Members can be removed from a room again, e.g. former participants or people who joined by
mistake.

## Decisions

- Any member may remove any other member. This follows the rule that all members have the
  same rights. Removing oneself stays "Remove participation" (019).
- A removed person can join again via the invitation link, because the link is not renewable
  in the MVP. Removal is therefore cleanup, not an access ban.
- The vote is handled like when leaving (019): deleted in an open round, kept with the name in a
  revealed round until the next round starts.

## Tasks

- Migration `supabase/migrations/20261014090800_remove_member.sql` with `remove_member(room_id, user_id)`.
- Client function `removeMember`, new error code `invalid_member`.
- "Remove" button per other member in the participant list (online and "Not online"),
  with a confirmation; disabled without a connection.
- Update `docs/data-and-action-contract.md` and `docs/supabase-setup.md`.

## Acceptance criteria

- A member can remove another member after confirming; the list and counts update live for everybody.
- The removed person is sent back to the join form on their next load.
- Open round: the removed person's vote is gone; revealed round: result unchanged.
- Removing oneself, unknown members and removal by outsiders are rejected.
- Type check, lint, build; check with separate profiles.

## Verification and result

Migration verified locally in PostgreSQL 16 (Docker, all migrations in order, three users): removing in
an open round deletes the vote and lowers the member count; removing after the reveal keeps the vote
with the name (`display_name` in the snapshot); removing oneself, a non-member and `null` return
`invalid_member`; an outsider gets `not_member`; the removed person gets `not_member` for room
queries and can join again with the token.

User interface verified in the browser (Playwright) with a simulated `remove_member` response,
since the migration was not applied in the real project yet: no button for oneself, confirmation
text, Cancel, "Yes, remove" removes the entry from the list; axe-core without findings. Type check,
lint and build error-free.

Open: check against the real Supabase project after applying the migration.
