# Setting up Supabase

This guide describes the one-time setup of the Supabase project. It grows with the work
packages (003 schema, 004 sign-in, 005–007 functions, 010 realtime) and was consolidated into
the full guide in work package 013. Names in the dashboard may change; the names below are
approximate.

## 1. Create the project

1. Create an account at <https://supabase.com> and choose an organization with the **Free** plan.
2. Choose **New project**, assign a name (e.g. `planning-poker`), a region nearby
   (e.g. Frankfurt) and a strong database password. The app does not need the password;
   keep it safe, do not store it in the repository.
3. Wait until the project is ready.

Note: free projects are paused after about a week of inactivity and can be reactivated in
the dashboard.

## 2. Apply the database schema

The migrations are in `supabase/migrations/`. They must be applied to an empty database
**in file name order**:

1. `20261014090000_tables.sql`
2. `20261014090100_access_rights.sql`
3. `20261014090200_room_access.sql`
4. `20261014090300_rounds.sql`
5. `20261014090400_votes.sql`
6. `20261014090500_realtime.sql` (adds the table `rooms` to the realtime publication)
7. `20261014090600_stable_results.sql` (work package 019: revealed results stay after
   "Remove participation")
8. `20261014090700_room_name.sql` (work package 022: optional room name)

For a database that is **already set up**, it is enough to run only the new files (7 and 8)
in this order. The app keeps running before they are applied; without migration 7 the vote
disappears when participation is removed, as before; without migration 8 there are no room
names (the input field then produces an error).

Easiest way: open the **SQL Editor** in the dashboard, paste the content of the file and run
it, then the next file. If you use the Supabase CLI, you can use `supabase link` and
`supabase db push` instead.

Afterwards the **Table Editor** should show the tables `rooms`, `room_invites`,
`room_members`, `rounds` and `votes`. All tables have row level security enabled; the browser
may only read data of rooms the person is a member of and write nothing directly.

## 3. Public keys

You need:

- the **Project URL** (`https://<project-ref>.supabase.co`) → `VITE_SUPABASE_URL`
- the **Publishable key** (starts with `sb_publishable_`) → `VITE_SUPABASE_PUBLISHABLE_KEY`

How to find both:

1. Open the project in the dashboard and click **Connect** at the top. The dialog shows the
   URL and publishable key to copy.
2. Alternatively under **Project Settings → API Keys**. If there is no publishable key yet,
   create a new one there.

The older `anon` key (long key, starts with `eyJ`) still works but will be retired by the end
of 2026; please use the publishable key. Both go into `.env.local` (see `README.md`).
**Never** use the `service_role` or `secret` key (`sb_secret_…`) in the frontend or in the
repository.

## 4. Enable anonymous sign-in (work package 004)

Under **Authentication → Sign In / Providers** enable the option **Allow anonymous
sign-ins** and save. Without it, participants cannot join without registering. The sign-in
needs neither keys nor provider registration. Anonymous users then appear under
**Authentication → Users** as "anonymous".

Notes:

- Supabase limits anonymous sign-ins to **30 per hour and IP address**. Behind a shared
  corporate IP the team shares this limit. Each browser signs in only once, after that the
  session is kept. If needed, you can raise the limit under **Authentication → Rate Limits**.
- Supabase recommends a CAPTCHA against abuse. In the MVP we do without it: room links are
  not public, and an anonymous sign-in alone grants no access to room data.
- Anonymous users use the role `authenticated`. The access rights from work package 003
  therefore rely on room membership and not on the role.

## 5. Quick check of the access rights (optional)

In the **SQL Editor** you can verify that a role that is not signed in sees nothing. The
query must produce the error `permission denied for table rooms`:

```sql
begin;
set local role anon;
select count(*) from public.rooms;
rollback;
```

For `authenticated` without membership, the query must instead return `0`:

```sql
begin;
set local role authenticated;
select count(*) from public.rooms;
rollback;
```
