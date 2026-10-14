-- Arbeitspaket 007: Stimme abgeben und ändern.
-- Eine Person hat je Raum höchstens eine Stimme (Primärschlüssel room_id + user_id). Die
-- Stimme gehört immer zur aktuellen Runde: Rundenwechsel löschen alle Stimmen (006).
--
-- Stimmen sind für Mitglieder des Raums lesbar, auch vor dem Aufdecken (bewusste Entscheidung:
-- das Verbergen ist eine Vereinbarung der Oberfläche, siehe docs/data-and-action-contract.md).

create function public.cast_vote(p_room_id uuid, p_round_id uuid, p_card text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_current uuid;
  v_status  text;
  v_changed integer;
begin
  -- Die Nutzer-ID kommt ausschließlich aus der Session; es gibt keinen Parameter dafür.
  perform private.lock_room_as_member(p_room_id, v_uid);

  if p_card is null or p_card not in ('0', '1', '2', '3', '5', '8', '13', '21', '?', 'coffee') then
    raise exception 'invalid_card' using errcode = 'P0001';
  end if;

  select rd.round_id, rd.status into v_current, v_status
  from public.rounds rd where rd.room_id = p_room_id;
  if v_current is null then
    raise exception 'no_round' using errcode = 'P0001';
  end if;
  if v_current is distinct from p_round_id then
    raise exception 'round_conflict' using errcode = 'P0001';
  end if;
  if v_status <> 'open' then
    raise exception 'round_not_open' using errcode = 'P0001';
  end if;

  -- Neue Stimme anlegen oder die eigene ersetzen. Gleiche Karte erneut zu senden ändert
  -- nichts (keine Revisionserhöhung, kein Echtzeit-Signal).
  insert into public.votes as v (room_id, user_id, round_id, card)
  values (p_room_id, v_uid, v_current, p_card)
  on conflict (room_id, user_id)
  do update set card = excluded.card
  where v.card is distinct from excluded.card;
  get diagnostics v_changed = row_count;

  if v_changed > 0 then
    update public.rooms set revision = revision + 1 where id = p_room_id;
  end if;

  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

revoke all on function public.cast_vote(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, text) to authenticated;
