# Data and Action Contract

This document defines how the user interface and the database work together. It is the
basis for work packages 003 (schema), 005–007 (database functions) and
008–011 (user interface, realtime, conflicts). Deviations are updated here.

## 1. Principles

- **The database is authoritative.** The user interface only shows states that the database
  has confirmed. Actions are database functions (RPC), not free table writes.
- **Identity** is the browser's anonymous Supabase `auth.uid()`. It is always derived from the
  session and never passed as a parameter. A display name is not a sign-in.
- **A room has exactly one current round** (or none yet). There is no history.
- **Membership, online presence and vote are separate things.** A member does not have to be
  online or have voted. There are no mandatory voters.
- **Votes are readable by members, even before the reveal.** Hiding them is an agreement of
  the user interface (deliberate decision, see roadmap), not secrecy.
- **All members have the same rights:** start a round, reveal, view the link, leave.
  Everyone may only vote for themselves.

## 2. Data model

```text
room
  id             uuid          internal ID, never appears in links
  created_at     timestamptz
  name           text          optional, 1–60 characters, NULL = no name (package 022)
  revision       bigint        increased on every visible state change (for realtime)

room_invite                     separate from room, not freely readable
  room_id        uuid  → room
  token          text          secret invitation token, unique

room_member (membership)
  room_id        uuid  → room
  user_id        uuid          auth.uid()
  display_name   text          1–40 characters, duplicate names allowed
  joined_at      timestamptz
  unique per (room_id, user_id)

round (current round, at most one per room)
  room_id        uuid  → room  unique
  round_id       uuid          new on EVERY round switch
  title          text          1–120 characters
  status         'open' | 'revealed'
  started_by     uuid
  started_at     timestamptz

vote
  room_id, round_id            refers to the current round
  user_id        uuid
  card           card value
  voter_name     text          only set if the person removed their participation after the
                               reveal (package 019); no foreign key to room_member
  unique per (room_id, user_id)   → at most one vote per person and round
```

### Room ID and invitation token

- The internal `room.id` is used for database relations and realtime filters.
- The **invitation token** is the access. It is cryptographically random and has at least
  128 bits of entropy. Implemented as two random UUIDs without hyphens (64 hex characters,
  about 244 bits) from the server's random generator, without depending on extensions.
- The invitation link only contains the token (`/r/<token>`). The token does not expire and
  cannot be regenerated in the MVP.
- Members get their room's token via `get_invite_token` so they can copy the link. There is
  no list of rooms or tokens.

### Card values (closed set)

An ASCII value is stored, the label is displayed:

| Stored      | Display | Kind         |
| ----------- | ------- | ------------ |
| `0`         | 0       | number       |
| `1`         | 1       | number       |
| `2`         | 2       | number       |
| `3`         | 3       | number       |
| `5`         | 5       | number       |
| `8`         | 8       | number       |
| `13`        | 13      | number       |
| `21`        | 21      | number       |
| `?`         | ?       | special card |
| `coffee`    | ☕      | special card |

A database check constraint allows only these values. Special cards are not part of numeric
evaluations.

### Inputs

- **Display name:** whitespace at the edges is trimmed; then 1–40 characters. Duplicate
  names in a room are allowed.
- **Title:** whitespace at the edges is trimmed; then 1–120 characters.
- **Room name (optional):** whitespace at the edges is trimmed; empty means "no name",
  otherwise at most 60 characters.
- The user interface always outputs names and titles as text, never as HTML.

## 3. States of a round

```text
                 start_round                    reveal_round
(no round)  ───────────────▶  open  ───────────────────────▶  revealed
                                 ▲  │                              │
                                 │  └──── start_round ◀────────────┘
                                 └─────── (replaces the round: new round_id, votes gone)
```

| State      | Meaning                                          | Allowed                               |
| ---------- | ------------------------------------------------ | ------------------------------------- |
| none       | Room freshly created, no round yet               | `start_round`                         |
| `open`     | Voting in progress                               | `cast_vote`, `reveal_round`, `start_round` |
| `revealed` | revealed, votes are final                        | `start_round`; `reveal_round` has no effect |

`start_round` is possible from any state and replaces the existing round completely.

## 4. Actions

All actions run as database functions. They check the session (`auth.uid()` present) and,
except for room creation and joining, the membership in the room concerned.

| Action                                   | Input                                          | Return                           |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------- |
| `create_room`                            | `display_name`, optional `room_name`           | `room_id`, `invite_token`        |
| `join_room`                              | `invite_token`, `display_name`                 | `room_id`                        |
| `leave_room`                             | `room_id`                                      | –                                |
| `get_invite_token`                       | `room_id`                                      | `invite_token`                   |
| `get_room_state` (snapshot)              | `room_id`                                      | see section 5                    |
| `start_round`                            | `room_id`, `expected_round_id`, `title`        | new state (snapshot)             |
| `set_room_name`                          | `room_id`, `name` (empty = remove)             | new state (snapshot)             |
| `reveal_round`                           | `room_id`, `round_id`                          | new state (snapshot)             |
| `cast_vote`                              | `room_id`, `round_id`, `card`                  | new state (snapshot)             |

Behavior in detail:

- **`create_room`**: creates the room, the invitation and the creator's membership in one
  transaction. It does not start a round yet.
- **`join_room`**: looks up the room via the token. If the person is already a member, only
  the display name is updated (idempotent, no duplicate). An invalid token returns
  `invalid_token` without revealing anything about other rooms.
- **`leave_room`**: removes the membership. In an **open** round the own vote is deleted. In
  a **revealed** round the vote is kept until the next round starts; the name is stored on
  the vote for this (`voter_name`) and appears in the result (package 019). Room and round
  remain. Joining again via the link is possible. A second call returns `not_member`; the
  user interface treats that as success. The user interface only calls the function through
  the confirmed action "Remove participation"; "Back to home" changes no data.
- **`set_room_name`**: sets, changes or removes (empty name) the room name. Any member may do
  this. A name that is too long returns `invalid_room_name`.
- **`start_round`**: `expected_round_id` is the round ID the caller last saw (`null` if it
  did not know a round yet). If it matches the current round, all votes are deleted and the
  round is replaced with a new `round_id`, new title and status `open`. Otherwise
  `round_conflict`.
- **`reveal_round`**: sets `open` to `revealed`, but only for the given `round_id`. If the
  round is already revealed, the state stays unchanged and the call counts as successful
  (repeating is harmless). A round without votes may be revealed. If the `round_id` does not
  match the current round: `round_conflict`.
- **`cast_vote`**: creates the own vote or replaces it while the round is `open`. Sending the
  same card again changes nothing.

### Error codes

Functions report business errors as stable codes; the user interface translates them into
messages.

| Code                | Cause                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `not_authenticated` | No session                                                           |
| `invalid_token`     | Invitation token unknown or malformed                                |
| `not_member`        | Not a member of the room (also for a non-existent room ID)           |
| `invalid_name`      | Name empty or longer than 40 characters                              |
| `invalid_title`     | Title empty or longer than 120 characters                            |
| `invalid_room_name` | Room name longer than 60 characters                                  |
| `invalid_card`      | Card value not in the allowed set                                    |
| `no_round`          | Action requires a round, there is none                               |
| `round_conflict`    | The given round ID is not (or no longer) the current one             |
| `round_not_open`    | Vote cast although the round is already revealed                     |

`not_member` is deliberately also used for unknown rooms so that nobody can probe room IDs.

## 5. State snapshot

`get_room_state` and the return values of the mutations deliver the same structure. It only
contains data of a room in which the caller is a member.

```text
room_id
name                     room name or null
revision                 current room revision
me                       { user_id, display_name }
members                  [{ user_id, display_name }]        members, not an online list
round                    null | {
                           round_id, title, status,
                           votes: [{ user_id, card,     all votes of the current round;
                                  display_name? }]  display_name only if participation was removed
                         }
```

Before the reveal the user interface only shows the number of votes and the own card. The
`members` list is a member list; who is currently online comes from presence (see below).

## 6. Concurrency

All write actions first lock the row of the room concerned (`SELECT … FOR UPDATE`). As a
result they run one after another per room. The expected round ID prevents a late action
from hitting the new round.

| Situation                                                    | Result                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Two `start_round` with the same `expected_round_id`          | The first is executed, the second gets `round_conflict`            |
| `reveal_round` for the previous round after a new round      | `round_conflict`, the new round stays hidden                       |
| `cast_vote` and `reveal_round` at the same time              | A vote before the reveal counts; afterwards `round_not_open`       |
| `cast_vote` for an old round after a round switch            | `round_conflict`, no vote in the new round                         |
| `reveal_round` twice for the same round                      | Both successful, one state change                                  |
| Double click on "New round"                                  | Second call carries the old ID → `round_conflict`, not a replacement |
| Several tabs of the same identity                            | One vote (unique per room/person), the last selection wins         |

The revision (`room.revision`) increases within the same transaction on every actual change:
join/leave, name change, round switch, reveal and new or changed vote. Ineffective
repetitions do not increase it. It serves realtime (010) as a reliable signal, even when rows
were deleted.

## 7. Connection loss and reopening

- Stored votes and the round stay unchanged during connection loss.
- Opening a room link never starts a round automatically. Only `start_round` does that.
- After reconnecting, the user interface loads a snapshot. A locally remembered card
  selection is reconciled with the stored vote and never carried over into a new round.
- On an unclear response to a mutation, load a snapshot first. Round switches are not
  repeated blindly; the expected round ID protects additionally.

### Presence (package 020)

Who is currently online in the room does not come from the database but from a realtime
presence channel `presence:<room_id>`. Each open room only reports its own user ID. Names
still come from the member list. The estimating group for "x of y voted" is the members
currently present online (including the own person). Former members do not count, but stay
visible with their check mark under "Not online" if they voted. The channel is not private:
anyone who knows the room ID could see anonymous user IDs, but neither names nor votes. Only
members learn the room ID. A private channel would need a realtime policy in the database.
Presence does not say whether someone is estimating or just watching.

## 8. Worked example round

Anna and Ben, room still without a round (revision 1, `round = null`).

1. Anna: `create_room("Anna")` → room, token. Anna shares `/r/<token>` in the Teams chat.
2. Ben: `join_room(token, "Ben")` → member. Revision 2.
3. Anna: `start_round(room, null, "STORY-1")` → round R1, `open`. Revision 3.
4. Ben: `start_round(room, null, "STORY-2")` at the same time → `round_conflict`, because R1
   exists. Ben loads the snapshot and sees R1.
5. Anna: `cast_vote(room, R1, "5")`. Ben: `cast_vote(room, R1, "8")`, then
   `cast_vote(room, R1, "13")`. Ben still has exactly one vote (`13`). Revision 4–6.
6. Anna sees "2 of 2 votes", only her card `5`. Ben reveals:
   `reveal_round(room, R1)` → `revealed`. Everyone sees Anna `5`, Ben `13`.
7. Anna: `cast_vote(room, R1, "3")` → `round_not_open`.
8. Anna and Ben click "New round" at the same time (both with `expected = R1`):
   The first action creates R2 and deletes all votes, the second gets `round_conflict`.
9. Ben closes the browser. Room and R2 remain. If Ben opens the link later, he is still a
   member (same browser identity) and sees R2.

## 9. Recorded decisions and open points

Decided:

- Name 1–40, title 1–120 characters; card value `coffee` stored instead of the emoji.
- Invitation token: 64 hex characters (two UUIDs), no expiry, not renewable in the MVP.
- The room revision as a realtime signal is already provided for in the model.
- `not_member` for unknown rooms, no difference from rooms of others.

Deliberately not part of the MVP and therefore open:

- Renewing the token, removing members, deleting rooms.
- Cleaning up orphaned rooms. Anonymous identities without membership may be cleaned up
  manually later; nothing deletes rooms automatically (see work package 013).
- Behavior with very many members. For team size no limit is planned.
