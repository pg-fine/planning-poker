-- Work package 006: round switching and reveal, plus the shared state snapshot.
-- Rights, error codes and concurrency behavior: docs/data-and-action-contract.md, sections 4-6.

-- Checks the caller's membership and then locks the room row.
-- All write actions of a room thereby run one after another. Without membership
-- (also for an unknown room) there is always the same error "not_member". The check before the
-- lock prevents strangers from holding locks with a guessed room ID; the check
-- afterwards catches leaves that happened between the check and the lock.
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

-- State snapshot of a room (structure: docs/data-and-action-contract.md, section 5).
-- It is deliberately a single SQL statement: it sees a consistent data state,
-- even if other transactions write in parallel.
-- Callers must have checked membership beforehand.
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

-- Read the current state (initial load, reconnect, reconciliation after a realtime signal).
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

-- Start a new round. Replaces the existing round completely (new round_id, all votes
-- deleted). p_expected_round_id is the round ID the caller last saw
-- (null if it did not know one yet). If it differs from the current one, someone else has
-- switched in the meantime: "round_conflict", and the newer round stays untouched.
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

    -- Remove the votes first: the foreign key does not allow changing round_id
    -- while votes still refer to it.
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

-- Reveal the round. Only applies to the given round; an already revealed round stays
-- unchanged (repeating is harmless). A round without votes may be revealed.
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
