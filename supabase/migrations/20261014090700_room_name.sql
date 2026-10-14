-- Work package 022: optional room name.
--
-- The name belongs to the room (rooms.name, at most 60 characters, NULL = no name). It is optionally
-- passed when creating and can be changed or removed by any member.
-- Existing rooms remain valid without a name.

alter table public.rooms add column name text;

alter table public.rooms add constraint rooms_name_valid
  check (name is null or (name = btrim(name) and char_length(name) between 1 and 60));

-- An empty name means "no name"; names that are too long are an error.
create function private.normalize_room_name(p_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_name text := regexp_replace(coalesce(p_name, ''), '^\s+|\s+$', '', 'g');
begin
  if char_length(v_name) = 0 then
    return null;
  end if;
  if char_length(v_name) > 60 then
    raise exception 'invalid_room_name' using errcode = 'P0001';
  end if;
  return v_name;
end;
$$;

revoke all on function private.normalize_room_name(text) from public, anon, authenticated;

-- create_room with an optional room name. Old calls with only one argument keep working.
drop function public.create_room(text);

create function public.create_room(p_display_name text, p_room_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_name  text;
  v_rname text;
  v_room  uuid;
  v_token text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  v_name := private.normalize_display_name(p_display_name);
  v_rname := private.normalize_room_name(p_room_name);
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.rooms (name) values (v_rname) returning id into v_room;
  insert into public.room_invites (room_id, token) values (v_room, v_token);
  insert into public.room_members (room_id, user_id, display_name)
  values (v_room, v_uid, v_name);

  return jsonb_build_object('room_id', v_room, 'invite_token', v_token);
end;
$$;

revoke all on function public.create_room(text, text) from public, anon, authenticated;
grant execute on function public.create_room(text, text) to authenticated;

-- Change the room name (or remove it with an empty name). Members only.
create function public.set_room_name(p_room_id uuid, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_rname text;
begin
  perform private.lock_room_as_member(p_room_id, v_uid);
  v_rname := private.normalize_room_name(p_name);

  update public.rooms set name = v_rname, revision = revision + 1
   where id = p_room_id and name is distinct from v_rname;

  return private.room_snapshot(p_room_id, v_uid);
end;
$$;

revoke all on function public.set_room_name(uuid, text) from public, anon, authenticated;
grant execute on function public.set_room_name(uuid, text) to authenticated;

-- Extend the snapshot with "name" (takes over the change from 20261014090600).
create or replace function private.room_snapshot(p_room_id uuid, p_uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'room_id', r.id,
    'name', r.name,
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
