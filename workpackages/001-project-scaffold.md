# 001 – Project scaffold

- **Status:** Done
- **Dependencies:** None
- **Milestone:** M1

## Goal

Create a React/TypeScript app as a basis that can be started locally and built statically.

## Tasks

- Set up Vite with React and TypeScript; fix a supported Node version.
- Decide on the package manager and check in the lock file.
- Create directories for the user interface, business logic and Supabase access as soon as needed.
- Create a start view with the app name and a simple page layout.
- Provide commands for development, type check, lint and production build.
- Create `.gitignore` and `.env.example` with placeholders for the Supabase URL and public key.
- Describe local start and build in the project README.

## Acceptance criteria

- Installation from the lock file and local start work.
- Type check, lint and build run successfully; the build produces static files in `dist/`.
- Without a Supabase configuration the app starts with an understandable setup notice.
- No test framework and no test code are created as a precaution.

## Verification and result

Verified with Node.js 22.22.1 and npm 9.2.0 (Linux sandbox):

- `npm ci` from a fresh `node_modules`: successful, 0 vulnerabilities reported.
- `npm run typecheck`, `npm run lint`, `npm run build`: each error-free; the build
  produces `dist/` (HTML, CSS, JS).
- `npm run dev`: the development server answers with HTTP 200.
- Start view without a Supabase configuration (server-side rendered): shows the setup notice
  with the missing variables. The configuration check distinguishes missing, invalid
  (`ftp://`, no URL) and valid values.

Not verified: rendering in a real browser (none is available in the sandbox) and the state
with a valid Supabase configuration in the browser. Please take a short look on the first
`npm run dev`.

Decisions:

- Package manager npm (lock file `package-lock.json`), Node.js >= 22.12 (`.nvmrc`, `engines`).
- TypeScript 6.0 instead of 7.x, because `typescript-eslint` currently only supports TypeScript < 6.1.
- No test framework and no test code created.
