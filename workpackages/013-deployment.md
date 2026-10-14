# 013 – Cloud setup and publishing

- **Status:** Done
- **Dependencies:** 012
- **Milestone:** M5
- **External prerequisite:** Supabase and Cloudflare accounts controlled by the user

## Goal

Publish the app on the chosen free plans and make the setup reproducible.

## Tasks

- Merge the previous Supabase setup into a step-by-step guide:
  project, migrations, anonymous sign-in, rights, realtime and public configuration.
- Check current free plan limits and auth rate limits, in particular several
  first sign-ins behind the same corporate IP; document necessary settings.
- Set up Cloudflare with build command, Node version and output directory `dist/`.
- Store the public Supabase URL and publishable/anon key as build configuration;
  do not check in local `.env` files and secret keys.
- Configure URL routing so that direct room links and reload also work on Cloudflare.
- Perform the HTTPS publication under `pages.dev`/`workers.dev` and explain the procedure in the README.
- Document the update order: compatible database migration, then frontend;
  consider the reuse of old room links.
- Add operating notes on free plan pausing, reactivation and budget/quota display.
- Describe a deliberate manual cleanup of unused data; no automatic
  room deletion and no blanket deletion of anonymous identities with active memberships.

## Acceptance criteria

- The published URL is reachable; a room link directly opens the matching view.
- Creation, joining and realtime work on the published app.
- The guide is enough to set up a new project without undocumented steps.
- The final URL and applied migration states are documented.
- Without account access the publication explicitly stays open/blocked.

## Verification and result

Prepared and verified:

- `docs/deployment.md`: complete guide (Supabase, Cloudflare via Git integration
  or direct upload, variables, Node version via `.nvmrc`, check after publishing,
  update order, operating limits, manual cleanup). Platform information was looked up in the current
  Cloudflare and Supabase documentation (including SPA behavior without `404.html`,
  build settings for Vite, Node 22, limits for anonymous sign-ins: 30 per hour and IP).
- `public/_headers`: Content-Security-Policy (only own scripts/styles, connections to
  `*.supabase.co` via HTTPS and WebSocket), `X-Frame-Options`, `Permissions-Policy`.
- `public/favicon.svg` and reference in `index.html`.
- `wrangler.jsonc` (Workers with static assets, SPA fallback) and `wrangler` as a development dependency,
  because the Cloudflare dashboard in the newer flow requires a "Deploy command" (`npx wrangler deploy`).
  Verified locally with `wrangler dev`: `/r/<token>` serves the app (200), the security headers apply.
- The production build was verified locally with a server that simulates Pages (static files,
  `_headers`, fallback to `index.html`), against the real Supabase project and in Chromium with two
  profiles: create room, direct request of the room link, join, live update via WebSocket
  under the CSP, vote, reveal, reload on `/r/<token>`, invalid link, favicon –
  without console errors and without CSP violations. Type check, lint and build are error-free.

Published and verified (Cloudflare Workers with static assets, Git integration, branch `main`):

- Address: https://planning-poker.peter-gruszka.workers.dev
- Home page and direct request of `/r/<token>` serve the app (200), security headers
  (CSP, `X-Frame-Options`, `Permissions-Policy`) are active.
- With two separate browser profiles on the real address: create room, join via link,
  live updates (join, round, number of votes, result, new round without old votes, leaving),
  hidden other people's cards, reload on `/r/<token>`, no console errors or CSP violations.
  Five runs: four error-free, one live update failed once (see addendum in package 011,
  meanwhile additionally secured).
- The final URL and migration state are in section 7 of `docs/deployment.md`.
