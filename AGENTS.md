# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project goal

A small browser app for planning poker, used alongside a Microsoft Teams meeting. Someone creates a
room, shares the link in the Teams chat, and participants join with just a display name (no
registration). Everyone picks a card, the cards are revealed together, and the team discusses the
differences.

Key product rules (details in `docs/data-and-action-contract.md`):

- Rooms and room links are permanent; nothing is deleted automatically.
- Only the current round is stored; a new round replaces title and votes. No history.
- All members have the same rights (start round, reveal, rename room, remove other members).
- Votes are readable by members before the reveal; hiding them is a UI agreement, not secrecy.
- Identity is the browser's anonymous Supabase user (`auth.uid()`); a display name is not a login.
- The whole project is in English: UI, code, comments, SQL comments, docs and work packages.

## Stack

- React + TypeScript + Vite (static single-page app), no router library, no state library.
- Supabase (Free): PostgreSQL with row level security, anonymous sign-in, Realtime.
- Cloudflare (Workers with static assets): every push to `main` deploys automatically.
- No own backend: all writes go through Postgres functions (RPC) defined in the migrations.

## Where things are

```text
src/domain/        business rules without dependencies (cards, results, validation)
src/supabase/      client, config, identity, typed RPC wrappers, snapshot parsing
src/ui/            React components, routing, local storage, styles.css
supabase/migrations/   SQL migrations, applied in file name order
supabase/maintenance/  manual cleanup SQL (not a migration)
docs/              contract, identity, Supabase setup, deployment
workpackages/      roadmap (README.md) and one file per work package
public/            favicon and Cloudflare headers (CSP)
presentation/      local slide deck, ignored by git
```

Start with `workpackages/README.md` (scope and history) and `docs/data-and-action-contract.md`
(data model, actions, error codes, concurrency). `src/ui/RoomView.tsx` and `src/ui/RoundPanel.tsx`
are the main screens; `src/ui/useRoomState.ts` handles loading, realtime and presence.

## Commands

| Command             | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | development server                   |
| `npm run typecheck` | TypeScript check (`tsc -b`)          |
| `npm run lint`      | ESLint                               |
| `npm run build`     | type check and production build      |

Run type check, lint and build before every commit.

Environment note: the repository lives on a Windows drive and `node_modules` is installed for
Windows. From WSL, `tsc` and `eslint` work directly, but `vite build` needs the Windows Node, e.g.
`cmd.exe /c "npm run build"`. Git uses `core.autocrlf=true` (working tree CRLF, repository LF).

## Testing policy

**Test code is only written when a concrete bug turns up.** No precautionary test framework, no
generated test suites, no TDD for new features. A found bug is documented with reproduction,
expected and actual behavior; a targeted regression test may then be added if it secures the fix.

Instead, every change is verified for real and the result is recorded in its work package:

- Browser checks with Playwright from a scratch directory outside the project (not checked in),
  using at least two separate browser profiles against the real Supabase project.
- New or changed migrations are first applied to a local PostgreSQL in Docker (all migrations in
  order, with `auth.uid()` and the roles `anon`/`authenticated` simulated) and played through with
  several users.
- Accessibility check with axe-core on changed screens, in light and dark mode.
- Say clearly what was not verified.

## Database changes

- Never edit an applied migration's logic; add a new migration file with the next timestamp.
- Functions are `SECURITY DEFINER` with `set search_path = ''`, take the user from `auth.uid()`,
  revoke rights from `public`/`anon` and grant execute to `authenticated` only.
- Every visible change increases `rooms.revision` (the realtime signal).
- Business errors are raised as stable codes (`raise exception 'code' using errcode = 'P0001'`)
  and must be added to `ROOM_ERROR_CODES` and the messages in `src/supabase/rooms.ts` and to the
  contract.
- Keep the app backward compatible until the migration is applied.
- The agent has no access to the Supabase project: the user applies migrations in the SQL Editor.
  Ask the user to do so, then verify against the real project.

## Working method

- Plan larger work as a work package in `workpackages/` (goal, tasks, acceptance criteria,
  verification and result) and add it to the table in `workpackages/README.md`.
- Keep commits small and coherent (e.g. migration, code, docs separately); push to `origin/main`
  when the user asked for it.
- Ask the user before product rule changes, anything that touches accounts or secrets, and
  anything with external effect. Record decisions in the work package or the contract.
- Update the docs (`docs/`, `README.md`) together with behavior changes.

## Security

- The frontend only contains the Supabase project URL and the publishable key (`.env.local`,
  never committed). Never use or commit a service role or secret key.
- Render names and titles as text, never as HTML.
- Do not weaken row level security; the browser may only read data of rooms it is a member of.
