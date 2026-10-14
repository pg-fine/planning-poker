# 002 – Data and action contract

- **Status:** Done
- **Dependencies:** None
- **Milestone:** M1

## Goal

Define small, unambiguous contracts for the UI and the database before the two drift apart.

## Tasks

- Document the model for room, membership, current round and vote.
- Separate the internal room ID from the secret invitation token.
- Provide a fresh round ID per round switch; old rounds are replaced.
- Define the states: no round yet, voting open, revealed.
- Define inputs, return values and business errors for creating, joining, new round, reveal,
  voting and leaving.
- Define a single vote per round and anonymous user ID; allow duplicate names.
- Define concurrent actions: mutations carry the expected round ID;
  old actions are rejected, repeated reveal is harmless.
- Define title and name lengths; reject empty values after trimming.
- Treat membership, online presence and existing vote separately.
- Define leaving: remove the membership, remove the own current vote;
  joining again is possible with the same room link.

## Acceptance criteria

- A short architecture/contract document contains state transitions and examples.
- There are clear rules for new rounds, late votes and simultaneous reveal.
- Card values including `?` and `☕` are defined as a closed set of values.
- The current round is kept during connection loss; a new call does not
  automatically start a new round.

## Verification and result

Result: [docs/data-and-action-contract.md](../docs/data-and-action-contract.md).

- All acceptance criteria are covered there: state transitions (section 3), rules for
  new rounds, late votes and simultaneous reveal (sections 4 and 6),
  closed card set including `?` and `coffee`/☕ (section 2), behavior during
  connection loss (section 7).
- The contract was played through in section 8 with a round of two participants,
  including simultaneous actions, reveal, round switch and later reopening.
- Open detail decisions are in section 9. No code and no test code was created.
