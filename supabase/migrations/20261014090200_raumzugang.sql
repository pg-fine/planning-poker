-- Arbeitspaket 005: Raumzugang und Mitgliedschaft.
-- Erstellen, Beitreten und Verlassen laufen ausschließlich über diese Funktionen; der Browser
-- hat keine Schreibrechte auf die Tabellen (siehe vorherige Migration).
--
-- Alle Funktionen:
--  * SECURITY DEFINER mit leerem search_path (alle Namen sind schema-qualifiziert),
--  * prüfen auth.uid() selbst und verwenden nie eine vom Aufrufer übergebene Nutzer-ID,
--  * sind nur für angemeldete Personen (auch anonyme) ausführbar, nicht für "anon",
--  * melden fachliche Fehler als stabilen Code im Meldungstext (SQLSTATE P0001),
--    siehe docs/daten-und-aktionsvertrag.md, Abschnitt 4.

-- Namen prüfen: Leerraum am Rand entfernen, danach 1-40 Zeichen.
create function private.normalize_display_name(p_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_name text := regexp_replace(coalesce(p_name, ''), '^\s+|\s+$', '', 'g');
begin
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  return v_name;
end;
$$;

-- Nur von den Funktionen unten (als Eigentümer) aufgerufen; kein Recht für API-Rollen.
revoke all on function private.normalize_display_name(text) from public, anon, authenticated;

-- Raum anlegen und den Ersteller als erstes Mitglied eintragen (eine Transaktion).
-- Das Token besteht aus zwei zufälligen UUIDs ohne Bindestriche: 64 Hex-Zeichen mit
-- etwa 244 Bit Zufall aus dem kryptografischen Zufallsgenerator des Servers.
create function public.create_room(p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text;
  v_room  uuid;
  v_token text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  v_name := private.normalize_display_name(p_display_name);
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.rooms default values returning id into v_room;
  insert into public.room_invites (room_id, token) values (v_room, v_token);
  insert into public.room_members (room_id, user_id, display_name)
  values (v_room, v_uid, v_name);

  return jsonb_build_object('room_id', v_room, 'invite_token', v_token);
end;
$$;

-- Mit Einladungstoken beitreten. Wiederholtes Beitreten ist unschädlich: es entsteht kein
-- Duplikat, höchstens wird der Anzeigename aktualisiert. Ein unbekanntes Token verrät nichts.
create function public.join_room(p_invite_token text, p_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_name     text;
  v_room     uuid;
  v_old_name text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  v_name := private.normalize_display_name(p_display_name);

  select i.room_id into v_room
  from public.room_invites i
  where i.token = p_invite_token;
  if v_room is null then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  -- Raum sperren: Beitritte, Austritte und spätere Rundenaktionen laufen nacheinander.
  perform 1 from public.rooms r where r.id = v_room for update;

  select m.display_name into v_old_name
  from public.room_members m
  where m.room_id = v_room and m.user_id = v_uid;

  if not found then
    insert into public.room_members (room_id, user_id, display_name)
    values (v_room, v_uid, v_name);
    update public.rooms set revision = revision + 1 where id = v_room;
  elsif v_old_name is distinct from v_name then
    update public.room_members
       set display_name = v_name
     where room_id = v_room and user_id = v_uid;
    update public.rooms set revision = revision + 1 where id = v_room;
  end if;

  return jsonb_build_object('room_id', v_room);
end;
$$;

-- Raum verlassen: Mitgliedschaft und eigene Stimme verschwinden (Fremdschlüssel mit
-- ON DELETE CASCADE). Raum und aktuelle Runde bleiben bestehen; der Link bleibt gültig.
create function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  perform 1 from public.rooms r where r.id = p_room_id for update;

  delete from public.room_members m
  where m.room_id = p_room_id and m.user_id = v_uid;
  if not found then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  update public.rooms set revision = revision + 1 where id = p_room_id;
end;
$$;

-- Einladungstoken für Mitglieder, damit sie den Link kopieren können.
create function public.get_invite_token(p_room_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_token text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  select i.token into v_token
  from public.room_invites i
  join public.room_members m on m.room_id = i.room_id and m.user_id = v_uid
  where i.room_id = p_room_id;
  if v_token is null then
    -- Gleiche Antwort für unbekannte Räume und fremde Räume.
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  return v_token;
end;
$$;

-- Ausführungsrechte: nur angemeldete Personen. Supabase vergibt auf neue Funktionen im
-- Schema "public" standardmäßig Rechte an anon; diese werden hier ausdrücklich entzogen.
revoke all on function public.create_room(text)         from public, anon, authenticated;
revoke all on function public.join_room(text, text)     from public, anon, authenticated;
revoke all on function public.leave_room(uuid)          from public, anon, authenticated;
revoke all on function public.get_invite_token(uuid)    from public, anon, authenticated;

grant execute on function public.create_room(text)      to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.leave_room(uuid)       to authenticated;
grant execute on function public.get_invite_token(uuid) to authenticated;
