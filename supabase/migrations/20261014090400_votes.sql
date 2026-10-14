-- Work package 007: cast and change a vote.
-- A person has at most one vote per room (primary key room_id + user_id). The
-- vote always belongs to the current round: round switches delete all votes (006).
--
-- Votes are readable by members of the room, even before the reveal (deliberate decision:
-- hiding them is an agreement of the user interface, see docs/data-and-action-contract.md).

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
    -- The user ID comes exclusively from the session; there is no parameter for it.
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

    -- Create a new vote or replace the own one. Sending the same card again changes
    -- nothing (no revision increase, no realtime signal).
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
