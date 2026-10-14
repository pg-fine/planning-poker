-- Work package 005: room access and membership.
-- Creating, joining and leaving go exclusively through these functions; the browser
-- has no write rights on the tables (see previous migration).
--
-- All functions:
--  * SECURITY DEFINER with an empty search_path (all names are schema-qualified),
--  * check auth.uid() themselves and never use a user ID passed by the caller,
--  * are only executable by signed-in people (including anonymous), not by "anon",
--  * report business errors as a stable code in the message text (SQLSTATE P0001),
--    see docs/data-and-action-contract.md, section 4.

-- Validate names: trim whitespace at the edges, then 1-40 characters.
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

-- Only called by the functions below (as owner); no right for API roles.
revoke all on function private.normalize_display_name(text) from public, anon, authenticated;

-- Create a room and register the creator as its first member (one transaction).
-- The token consists of two random UUIDs without hyphens: 64 hex characters with
-- about 244 bits of randomness from the server's cryptographic random generator.
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

-- Join with an invitation token. Joining repeatedly is harmless: no duplicate is created,
-- at most the display name is updated. An unknown token reveals nothing.
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

    -- Lock the room: joins, leaves and later round actions run one after another.
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

-- Leave the room: membership and own vote disappear (foreign key with
-- ON DELETE CASCADE). Room and current round remain; the link stays valid.
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

-- Invitation token for members so they can copy the link.
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
        -- Same answer for unknown rooms and rooms of others.
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  return v_token;
end;
$$;

-- Execute rights: only signed-in people. Supabase grants rights to anon on new functions in the
-- schema "public" by default; these are explicitly revoked here.
revoke all on function public.create_room(text)         from public, anon, authenticated;
revoke all on function public.join_room(text, text)     from public, anon, authenticated;
revoke all on function public.leave_room(uuid)          from public, anon, authenticated;
revoke all on function public.get_invite_token(uuid)    from public, anon, authenticated;

grant execute on function public.create_room(text)      to authenticated;
grant execute on function public.join_room(text, text) to authenticated;
grant execute on function public.leave_room(uuid)       to authenticated;
grant execute on function public.get_invite_token(uuid) to authenticated;
