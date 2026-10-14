# 004 – Supabase connection and identity

- **Status:** Done (sign-in in the browser UI not yet seen by you)
- **Dependencies:** 001
- **Milestone:** M1

## Goal

Give participants a recognizable browser identity without registration.

## Tasks

- Configure the Supabase client with the project URL and public publishable/anon key.
- Document enabling anonymous sign-in in the Supabase project.
- Load an existing session; only sign in anonymously if there is no session.
- Deduplicate concurrent initialization within the app.
- Provide session restoration, loading state and auth errors.
- Treat display names as business input, not as authentication.
- Document behavior with cleared browser data or an expired session.

## Acceptance criteria

- On first entry an anonymous identity is created without email/password.
- Reloading reuses the existing identity.
- Additional tabs with an already stored session use the same identity.
- On auth errors an understandable message with a retry stays visible.
- Missing configuration and anonymous sign-in not enabled are distinguishable.

## Verification and result

Implementation:

- `src/supabase/client.ts`: one shared client per window (session in `localStorage`,
  no URL evaluation).
- `src/supabase/identity.ts`: `ensureIdentity` (reuse session, discard invalid session,
  otherwise sign in anonymously; dedupe within the app, browser lock across tabs;
  error kinds `anonymous_disabled`, `rate_limited`, `network`, `unknown`) and messages.
- `src/ui/useIdentity.ts`, `src/ui/IdentityGate.tsx`: loading state, error with
  "Try again", ready view with a shortened ID of the browser.
- `docs/identity.md`: behavior with cleared browser data, another profile, invalid
  session and the error kinds.

Verified against the real Supabase project (Node scripts with a file-based `localStorage`
as "browser profile", no test code checked in):

- The first sign-in without email/password creates an anonymous identity (`is_anonymous`).
- Three concurrent calls share one operation and return the same ID.
- Reloading (same profile, twice) keeps the same ID; another profile gets a new one.
- A deliberately corrupted session is discarded and replaced by a new identity.
- An unreachable address yields `network`, a wrong key `unknown`; a repeated call
  starts a new attempt each time.
- As a signed-in anonymous person without membership: `rooms`, `room_members`, `rounds`,
  `votes` return 0 rows, `room_invites` and any write are rejected with `42501 permission
  denied`. This confirms the migration and read rights from work package 003 in the real
  project (check with the public key).
- Type check, lint and build are error-free.

Not verified:

- The case "anonymous sign-in disabled" (the switch is on for you; the error code is only
  recognized based on the Supabase documentation) and the rate limit case.
- Rendering in a real browser and the behavior of multiple tabs (the browser lock
  is only secured by code review).

Please start `npm run dev` once: "Ready" with an ID should appear, which stays the same
after reloading and in a second tab, but differs in a private window.
During testing some anonymous test users were created in the project (visible under Authentication →
Users, without meaning, may be deleted).
