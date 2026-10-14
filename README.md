# Planning Poker

A browser app for estimating together, used alongside a Teams meeting. A room link is
shared in the Teams chat; all participants open it in the browser.

Technology stack: React, TypeScript and Vite for the user interface,
Supabase (Free) for the database, anonymous sign-in and realtime, Cloudflare (Free)
for hosting. The roadmap and work packages are in [`workpackages/`](workpackages/README.md).

## Requirements

- Node.js 22.12 or newer (see `.nvmrc`)
- npm (comes with Node.js)

## Run locally

```bash
npm ci            # install dependencies exactly as in package-lock.json
cp .env.example .env.local
npm run dev       # development server, by default http://localhost:5173
```

Without a Supabase configuration the app starts with a setup notice. Enter the project
URL and the public publishable/anon key of your Supabase project in `.env.local` and
restart the development server:

| Variable                        | Meaning                                      |
| ------------------------------- | -------------------------------------------- |
| `VITE_SUPABASE_URL`             | Project URL, e.g. `https://abc.supabase.co`  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public publishable/anon key                  |

**Never** use a service role or secret key in the frontend. `.env.local` is excluded from
version control via `.gitignore`.

## Commands

| Command             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Development server with hot reload                            |
| `npm run typecheck` | TypeScript type check (`tsc -b`)                              |
| `npm run lint`      | ESLint                                                        |
| `npm run build`     | Type check and production build; static files in `dist/`      |
| `npm run preview`   | Preview the built version locally                             |

## Project structure

```text
src/
  main.tsx        Entry point
  ui/             User interface (React components, routing, styles)
  domain/         Business rules without dependencies (cards, input validation)
  supabase/       Supabase configuration, sign-in and database access
supabase/
  migrations/     SQL migrations (apply in file name order)
public/           Static files (favicon, Cloudflare headers)
docs/             Contract, identity, Supabase setup, deployment
workpackages/     Roadmap and work packages
```

## Deployment

Step-by-step guide for Supabase and Cloudflare (both free plans):
[`docs/deployment.md`](docs/deployment.md).

## Quality assurance

Test code is only written when a concrete bug turns up. Checks are done with type
check, lint, build and manual functional checks.
