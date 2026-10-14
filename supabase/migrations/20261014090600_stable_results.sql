-- Work package 019: revealed results stay stable, even if someone removes their participation.
--
-- Previously "leave_room" always deleted the vote through the foreign key votes_member_fkey
-- (ON DELETE CASCADE), even from an already revealed result. Now:
--  * Open round: when removing participation, the own vote is deleted (as before).
--  * Revealed round: the vote is kept until the next round starts. The name is stored
--    on the vote for this (voter_name), because the membership goes away. The name
--    thus stays visible in the result until the next round starts (start_round deletes all votes).
--
-- For this, the binding of the vote to the membership is dropped. Votes are still only written via
-- cast_vote, and that requires an existing membership.

alter table public.votes drop constraint votes_member_fkey;

alter table public.votes add column voter_name text;

alter table public.votes add constraint votes_voter_name_valid
  check (voter_name is null or char_length(voter_name) between 1 and 40);

-- Snapshot: votes additionally contain "display_name" if the person is no longer a member.
create or replace function private.room_snapshot(p_room_id uuid, p_uid uuid)
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
              || case
                   when v.voter_name is null then '{}'::jsonb
                   else jsonb_build_object('display_name', v.voter_name)
                 end
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

-- Remove participation: open round -> delete vote; revealed round -> keep vote with name.
create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_name   text;
  v_status text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  perform 1 from public.rooms r where r.id = p_room_id for update;

  select m.display_name into v_name
  from public.room_members m
  where m.room_id = p_room_id and m.user_id = v_uid;
  if not found then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  select rd.status into v_status from public.rounds rd where rd.room_id = p_room_id;
  if v_status = 'revealed' then
    update public.votes
       set voter_name = v_name
     where room_id = p_room_id and user_id = v_uid;
  else
    delete from public.votes where room_id = p_room_id and user_id = v_uid;
  end if;

  delete from public.room_members m
  where m.room_id = p_room_id and m.user_id = v_uid;

  update public.rooms set revision = revision + 1 where id = p_room_id;
end;
$$;
