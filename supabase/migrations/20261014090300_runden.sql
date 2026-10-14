-- Arbeitspaket 006: Rundenwechsel und Aufdecken, plus der gemeinsame Zustands-Snapshot.
-- Rechte, Fehlercodes und Konkurrenzverhalten: docs/daten-und-aktionsvertrag.md, Abschnitt 4-6.

-- Prüft die Mitgliedschaft der aufrufenden Person und sperrt danach die Raumzeile.
-- Alle schreibenden Aktionen eines Raums laufen dadurch nacheinander. Ohne Mitgliedschaft
-- (auch bei unbekanntem Raum) gibt es immer denselben Fehler "not_member". Die Prüfung vor der
-- Sperre verhindert, dass Fremde mit einer geratenen Raum-ID Sperren halten; die Prüfung
-- danach fängt Austritte ab, die zwischen Prüfung und Sperre passiert sind.
create function private.lock_room_as_member(p_room_id uuid, p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if not private.is_room_member(p_room_id) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  perform 1 from public.rooms r where r.id = p_room_id for update;

  if not private.is_room_member(p_room_id) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.lock_room_as_member(uuid, uuid) from public, anon, authenticated;

-- Zustands-Snapshot eines Raums (Aufbau: docs/daten-und-aktionsvertrag.md, Abschnitt 5).
-- Es ist bewusst eine einzige SQL-Anweisung: Sie sieht einen konsistenten Datenstand,
-- auch wenn parallel andere Transaktionen schreiben.
-- Aufrufer müssen die Mitgliedschaft vorher geprüft haben.
create function private.room_snapshot(p_room_id uuid, p_uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'room_id', r.id,
    'revision', r.revision,
    'me', (
      select jsonb_build_object('user_id', m.user_id, 'display_name', m.display_name)
      from public.room_members m
      where m.room_id = r.id and m.user_id = p_uid
    ),
    'members', coalesce((
      select jsonb_agg(
        jsonb_build_object('user_id', m.user_id, 'display_name', m.display_name)
        order by m.joined_at, m.user_id
      )
      from public.room_members m
      where m.room_id = r.id
    ), '[]'::jsonb),
    'round', (
      select jsonb_build_object(
        'round_id', rd.round_id,
        'title', rd.title,
        'status', rd.status,
        'votes', coalesce((
          select jsonb_agg(
            jsonb_build_object('user_id', v.user_id, 'card', v.card)
            order by v.user_id
          )
          from public.votes v
          where v.room_id = rd.room_id and v.round_id = rd.round_id
        ), '[]'::jsonb)
      )
      from public.rounds rd
      where rd.room_id = r.id
    )
  )
  from public.rooms r
  where r.id = p_room_id;
$$;

revoke all on function private.room_snapshot(uuid, uuid) from public, anon, authenticated;

-- Aktuellen Zustand lesen (Erstladen, Wiederverbinden, Abgleich nach Echtzeit-Signal).
create function public.get_room_state(p_room_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if not private.is_room_member(p_room_id) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;
  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

-- Neue Runde starten. Ersetzt die vorhandene Runde vollständig (neue round_id, alle Stimmen
-- gelöscht). p_expected_round_id ist die Runden-ID, die der Aufrufer zuletzt gesehen hat
-- (null, wenn er noch keine kannte). Weicht sie von der aktuellen ab, hat jemand anderes
-- inzwischen gewechselt: "round_conflict", und die neuere Runde bleibt unangetastet.
create function public.start_round(
  p_room_id uuid,
  p_expected_round_id uuid,
  p_title text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_title   text;
  v_current uuid;
begin
  perform private.lock_room_as_member(p_room_id, v_uid);

  v_title := regexp_replace(coalesce(p_title, ''), '^\s+|\s+$', '', 'g');
  if char_length(v_title) < 1 or char_length(v_title) > 120 then
    raise exception 'invalid_title' using errcode = 'P0001';
  end if;

  select rd.round_id into v_current from public.rounds rd where rd.room_id = p_room_id;
  if v_current is distinct from p_expected_round_id then
    raise exception 'round_conflict' using errcode = 'P0001';
  end if;

  -- Erst die Stimmen entfernen: Der Fremdschlüssel erlaubt keine Änderung der round_id,
  -- solange noch Stimmen darauf verweisen.
  delete from public.votes where room_id = p_room_id;

  if v_current is null then
    insert into public.rounds (room_id, title, started_by)
    values (p_room_id, v_title, v_uid);
  else
    update public.rounds
       set round_id   = gen_random_uuid(),
           title      = v_title,
           status     = 'open',
           started_by = v_uid,
           started_at = now()
     where room_id = p_room_id;
  end if;

  update public.rooms set revision = revision + 1 where id = p_room_id;
  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

-- Runde aufdecken. Gilt nur für die übergebene Runde; eine schon aufgedeckte Runde bleibt
-- unverändert (Wiederholung ist unschädlich). Eine Runde ohne Stimmen darf aufgedeckt werden.
create function public.reveal_round(p_room_id uuid, p_round_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_current uuid;
  v_status  text;
begin
  perform private.lock_room_as_member(p_room_id, v_uid);

  select rd.round_id, rd.status into v_current, v_status
  from public.rounds rd where rd.room_id = p_room_id;
  if v_current is null then
    raise exception 'no_round' using errcode = 'P0001';
  end if;
  if v_current is distinct from p_round_id then
    raise exception 'round_conflict' using errcode = 'P0001';
  end if;

  if v_status = 'open' then
    update public.rounds set status = 'revealed' where room_id = p_room_id;
    update public.rooms set revision = revision + 1 where id = p_room_id;
  end if;

  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

revoke all on function public.get_room_state(uuid)              from public, anon, authenticated;
revoke all on function public.start_round(uuid, uuid, text)     from public, anon, authenticated;
revoke all on function public.reveal_round(uuid, uuid)          from public, anon, authenticated;

grant execute on function public.get_room_state(uuid)           to authenticated;
grant execute on function public.start_round(uuid, uuid, text)  to authenticated;
grant execute on function public.reveal_round(uuid, uuid)       to authenticated;
