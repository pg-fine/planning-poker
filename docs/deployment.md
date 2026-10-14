# Deploying with Cloudflare and Supabase

This guide puts the app on the internet (HTTPS, free `workers.dev` or `pages.dev` address).
You need two free accounts that you control yourselves: **Supabase** and **Cloudflare**. No
IT approval and no server of your own is needed.

Platform information as of October 2026. Names in the dashboard may change.

## Overview

```text
Browser ──► Cloudflare (static files from dist/)
   │
   └──────► Supabase (database, anonymous sign-in, realtime)
```

At runtime the web app only contains two **public** values: the Supabase project URL and the
publishable key. They are embedded at build time (variables `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY`). Never use a `secret` or `service_role` key.

## 1. Prepare Supabase

Everything else is in [`supabase-setup.md`](supabase-setup.md). In short:

1. Create a project (Free plan).
2. Run all migrations from `supabase/migrations/` **in file name order** in the SQL Editor.
3. Enable anonymous sign-in (Authentication → Sign In / Providers).
4. Note the Project URL and publishable key (Connect dialog).

## 2. Set up Cloudflare

There are two ways. For both you need a free Cloudflare account.

### Way A: Git integration (recommended if you have a GitHub repository)

Advantage: every push to `main` publishes automatically.

Cloudflare is merging Pages and Workers. Depending on the account, the dashboard shows the
newer **Workers flow** (field "Deploy command") or the classic Pages flow. The repository is
prepared for both: `wrangler.jsonc` describes serving the app as a static single-page app.

**Workers flow (field "Deploy command" visible):**

1. In the Cloudflare dashboard: **Workers & Pages → Create application → Import a
   repository** (or "Connect to Git"), select the GitHub repository.
2. Settings:

   | Setting           | Value                                                             |
   | ----------------- | ----------------------------------------------------------------- |
   | Project name      | `planning-poker` (must match the `name` in `wrangler.jsonc`)      |
   | Production branch | `main`                                                            |
   | Build command     | `npm run build`                                                   |
   | Deploy command    | `npx wrangler deploy` (default value, do not change)              |
   | Root directory    | leave empty                                                       |

3. Enter the variables (see below). In the Workers flow they belong to the **build
   variables** ("Build variables and secrets"), not to the runtime variables: they are
   embedded into the app at build time.
4. **Save and Deploy**. Afterwards the app is reachable at
   `https://planning-poker.<account>.workers.dev`.

**Classic Pages flow (no "Deploy command" field):** build command `npm run build`, build
output directory `dist`, variables under Settings → Environment variables. `wrangler.jsonc`
is then not needed but does no harm.

**Variables (both flows, production):**

| Variable                        | Value                                         |
| ------------------------------- | --------------------------------------------- |
| `VITE_SUPABASE_URL`             | Project URL, e.g. `https://abc.supabase.co`   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`)          |

The Node version (22) is read from the `.nvmrc` file. Otherwise set `NODE_VERSION=22`.
Changes to the variables only take effect after a new build.

### Way B: Direct upload (without Git)

Disadvantage: a direct-upload project cannot be switched to Git integration later; you would
have to create a new project.

1. Build locally (with your `.env.local`, see `README.md`):

   ```bash
   npm ci
   npm run build
   ```

2. On the command line: `npx wrangler login`, then `npx wrangler deploy` (uses
   `wrangler.jsonc`). In the classic Pages flow alternatively by drag and drop:
   **Workers & Pages → Create application → Pages → Upload assets**, drag the `dist/` folder
   in.
3. For every update, build again and upload again.

### Routing and headers

- Direct requests and reloads of room links (`/r/<token>`): in the Workers flow
  `not_found_handling: single-page-application` in `wrangler.jsonc` makes sure `index.html`
  is served. In the classic Pages flow this happens automatically as long as there is no
  `404.html`. Therefore do **not** create a `404.html`.
- `public/_headers` sets a Content-Security-Policy and further security headers. The policy
  allows connections to `https://*.supabase.co` and `wss://*.supabase.co`. If you later use a
  custom domain for Supabase, adjust `connect-src`.

## 3. Check after publishing

1. Open the published address (`*.workers.dev` or `*.pages.dev`): the home page appears (no
   setup notice).
2. Create a room, open the link in a **second browser profile or private window** and join.
3. Vote, reveal, new round: both windows update without reloading.
4. Open the room link directly in a new tab and reload the page.

If the home page shows "Setup required", the variables are missing in the build (Way A: set
the variables and deploy again; Way B: build locally with `.env.local`).

## 4. Updating

Order for changes that affect the database:

1. **First run the new migration** in the Supabase SQL Editor. Migrations should be backward
   compatible so that the previously published app keeps working for a short time. Whether
   that holds for a concrete change must be checked when the migration is created.
2. **Then** publish the frontend (push or new upload).

Existing room links stay valid. The rooms live in the database, not in the frontend.

## 5. Operation and limits (free plans)

- **Pausing:** Supabase may pause free projects after about **7 days of inactivity**. The app
  then shows a connection message. In the Supabase dashboard **restore** the project;
  rooms and room links are available again afterwards. An upgrade to Pro prevents this.
- **Anonymous sign-ins:** limit **30 per hour and IP address**. Each browser signs in only
  once, after that the session stays. Behind a shared corporate IP the team shares the limit;
  raise it under Authentication → Rate Limits if needed. Renewing sessions (token refresh) is
  also limited per IP (according to the docs 1800 per hour).
- **Realtime:** in the Free plan, according to the pricing page, 200 concurrent connections
  and 2 million messages per month are included. That is enough for small teams. Check the
  usage in the dashboard.
- **Cloudflare Free:** 500 builds per month, up to 20,000 files per site (the app has few).
  No custom domain needed.
- **Backups:** free projects have no downloadable backups. The data is transient (only
  current rounds) and can be recreated at any time.
- **Network:** participants must be able to reach `*.workers.dev` or `*.pages.dev` and
  `*.supabase.co` (HTTPS and WebSocket). If a network blocks WebSockets, the app polls every
  5 seconds and stays usable. Even with a working live connection it reconciles the state
  every 30 seconds in case an event was lost.

## 6. Cleaning up

There is deliberately no automatic deletion: rooms stay permanently. If you want to clean up
manually:

- **Delete rooms** (members, round and votes disappear with them): in the SQL Editor
  `delete from public.rooms where id = '<room-id>';`. Unused rooms can be recognized e.g. by
  `revision = 1` (never used) or by `created_at`. Check beforehand that nobody still needs
  the link.
- **Anonymous users** under Authentication → Users only delete if they are not a member of
  any room: deleting a user removes their memberships and votes **and the current round if
  they started it**. A blanket deletion "older than X days" can hit active participants.

## 7. Documenting the current state

After the first publication, enter here (do not commit if not wanted):

| Item                         | Value |
| ---------------------------- | ----- |
| App URL                      | https://planning-poker.peter-gruszka.workers.dev |
| Supabase project (reference) |       |
| Last applied migration       | 20261014090700_room_name.sql |
| Deploy way (A or B)          | A (Git integration, Workers flow) |
