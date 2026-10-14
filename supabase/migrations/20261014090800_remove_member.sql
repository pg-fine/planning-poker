-- Work package 024: remove other members from a room.
--
-- Any member may remove any other member (all members have the same rights, see
-- docs/data-and-action-contract.md). The removed person can join again via the invitation link;
-- the link is not renewable in the MVP. The vote is handled like in leave_room:
--  * Open round: the vote of the removed person is deleted.
--  * Revealed round: the vote stays until the next round starts, together with the name
--    (voter_name), so the result does not change.
-- Removing oneself is not allowed here; leave_room is used for that.

create function public.remove_member(p_room_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_name   text;
  v_status text;
begin
  perform private.lock_room_as_member(p_room_id, v_uid);

  if p_user_id is null or p_user_id = v_uid then
    raise exception 'invalid_member' using errcode = 'P0001';
  end if;

  select m.display_name into v_name
  from public.room_members m
  where m.room_id = p_room_id and m.user_id = p_user_id;
  if not found then
    raise exception 'invalid_member' using errcode = 'P0001';
  end if;

  select rd.status into v_status from public.rounds rd where rd.room_id = p_room_id;
  if v_status = 'revealed' then
    update public.votes
       set voter_name = v_name
     where room_id = p_room_id and user_id = p_user_id;
  else
    delete from public.votes where room_id = p_room_id and user_id = p_user_id;
  end if;

  delete from public.room_members m
  where m.room_id = p_room_id and m.user_id = p_user_id;

  update public.rooms set revision = revision + 1 where id = p_room_id;
  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

revoke all on function public.remove_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
