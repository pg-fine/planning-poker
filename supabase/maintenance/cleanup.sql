-- Manual database cleanup. Run the statements one by one in the Supabase SQL Editor.
-- Every delete is wrapped in a transaction that ends with ROLLBACK, so nothing is deleted until
-- you replace "rollback;" with "commit;". Run the previews (1 and 5) first.
-- This file is not a migration; do not apply it automatically.

-- 1. Preview: rooms with their last activity (last round start or join; vote changes are not timestamped)
select r.id, r.name, r.created_at, r.revision,
       (select count(*) from public.room_members m where m.room_id = r.id) as members,
       greatest(r.created_at,
                coalesce((select max(rd.started_at) from public.rounds rd where rd.room_id = r.id), r.created_at),
                coalesce((select max(m.joined_at) from public.room_members m where m.room_id = r.id), r.created_at)) as last_activity
from public.rooms r
order by last_activity;

-- 2. Delete rooms that have been inactive for 30 days (members, invitation, round and votes go with them;
--    the room links become invalid)
begin;
delete from public.rooms r
where greatest(r.created_at,
               coalesce((select max(rd.started_at) from public.rounds rd where rd.room_id = r.id), r.created_at),
               coalesce((select max(m.joined_at) from public.room_members m where m.room_id = r.id), r.created_at))
      < now() - interval '30 days';
rollback;  -- to apply: commit;

-- 3. Delete rooms without any member (e.g. after everyone was removed)
begin;
delete from public.rooms r
where not exists (select 1 from public.room_members m where m.room_id = r.id);
rollback;  -- to apply: commit;

-- 4. Delete a specific room (e.g. test rooms), by ID or by name
begin;
delete from public.rooms where id = '<room-id>';
-- delete from public.rooms where name ilike 'test%';
rollback;  -- to apply: commit;

-- 5. Preview: orphaned anonymous users (no membership in any room, no round started)
select u.id, u.created_at, u.last_sign_in_at
from auth.users u
where u.is_anonymous
  and not exists (select 1 from public.room_members m where m.user_id = u.id)
  and not exists (select 1 from public.rounds rd where rd.started_by = u.id)
  and u.created_at < now() - interval '7 days'
order by u.created_at;

-- 6. Delete these users. The 7-day window protects people who signed in but have not joined a room
--    yet. Run this after 2-4 so users who were only in deleted rooms are included.
begin;
delete from auth.users u
where u.is_anonymous
  and not exists (select 1 from public.room_members m where m.user_id = u.id)
  and not exists (select 1 from public.rounds rd where rd.started_by = u.id)
  and u.created_at < now() - interval '7 days';
rollback;  -- to apply: commit;
