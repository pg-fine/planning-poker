# 023 – Translation to English

- **Status:** Done
- **Dependencies:** 022
- **Milestone:** M8: English

## Goal

Translate the whole project to English: user interface, code comments, SQL comments,
documentation, work packages and file names.

## Tasks

- Translate all texts and messages of the user interface; set `lang="en"`, use English
  number/date formats.
- Translate code comments, SQL comments and configuration comments.
- Translate README, `docs/` and `workpackages/`.
- Rename German file names (docs, work packages, migrations) and update all links.

## Acceptance criteria

- No German texts remain in the user interface, code, documentation and file names.
- Type check, lint and build run successfully; the app works unchanged.

## Verification and result

Done:

- User interface, messages, comments, SQL comments, configuration comments, README, `docs/`
  and `workpackages/` are translated. `index.html` has `lang="en"`; dates and numbers are
  formatted with `en-GB`/`en-US`.
- File names renamed: `docs/` (`deployment.md`, `data-and-action-contract.md`, `identity.md`,
  `supabase-setup.md`), all work packages and the migration files (e.g.
  `20261014090000_tables.sql`). The migration contents are unchanged except for comments.
  If the database was set up from the old file names, nothing needs to be redone: the file
  names are not stored in the database.
- The placeholder values in `.env.example` and `src/supabase/config.ts` are now
  `https://your-project.supabase.co` and `your-publishable-key`.

Verified (headless Chromium via Playwright, two separate profiles, real Supabase project):
create room with a room name, start round, vote, reveal (distribution, agreement text, average
note), "Estimate again", presence list, recently used rooms; axe-core without findings.
Type check, lint and build error-free.
Not verified: the published app after the next automatic deployment.
