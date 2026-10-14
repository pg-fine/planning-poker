-- Work package 010: realtime signal for room changes.
-- Every visible change (join, leave, names, round, reveal, vote) increases
-- rooms.revision. The app subscribes to changes of its room row and reloads the
-- snapshot via get_room_state on every signal. The data itself does not travel over the realtime channel.
--
-- Only the table "rooms" is published: it contains neither names nor votes, and the
-- RLS policy (only members may read) also applies to realtime events. Strangers
-- receive no events.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'rooms'
     )
  then
    alter publication supabase_realtime add table public.rooms;
  end if;
end;
$$;
