-- Arbeitspaket 010: Echtzeit-Signal für Raumänderungen.
-- Jede sichtbare Änderung (Beitritt, Austritt, Namen, Runde, Aufdecken, Stimme) erhöht
-- rooms.revision. Die App abonniert Änderungen ihrer Raumzeile und lädt bei jedem Signal den
-- Snapshot per get_room_state nach. Die Daten selbst laufen nicht über den Echtzeitkanal.
--
-- Nur die Tabelle "rooms" wird veröffentlicht: Sie enthält weder Namen noch Stimmen, und die
-- RLS-Richtlinie (nur Mitglieder dürfen lesen) gilt auch für Echtzeit-Ereignisse. Fremde
-- erhalten keine Ereignisse.

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
