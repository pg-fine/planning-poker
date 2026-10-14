import type { PostgrestError } from '@supabase/supabase-js'
import type { AppSupabaseClient } from './client.ts'

/**
 * Business error codes of the database functions (see docs/data-and-action-contract.md).
 * `network` and `unknown` come from the frontend, all others from the database.
 */
export const ROOM_ERROR_CODES = [
  'not_authenticated',
  'invalid_token',
  'not_member',
  'invalid_name',
  'invalid_title',
  'invalid_room_name',
  'invalid_card',
  'no_round',
  'round_conflict',
  'round_not_open',
] as const

export type RoomErrorCode = (typeof ROOM_ERROR_CODES)[number] | 'network' | 'unknown'

export class RoomError extends Error {
  readonly code: RoomErrorCode

  constructor(code: RoomErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RoomError'
    this.code = code
  }
}

const MESSAGES: Record<RoomErrorCode, string> = {
  not_authenticated: 'You are not signed in. Reload the page.',
  invalid_token: 'This invitation link is invalid.',
  not_member: 'You are not a member of this room.',
  invalid_name: 'The name must be 1 to 40 characters long.',
  invalid_title: 'The title must be 1 to 120 characters long.',
  invalid_room_name: 'The room name may be at most 60 characters long.',
  invalid_card: 'This card is not allowed.',
  no_round: 'There is no round yet.',
  round_conflict: 'The round has changed in the meantime.',
  round_not_open: 'The round has already been revealed.',
  network:
    'Supabase is unreachable. Check your internet connection. Other possible causes: a free Supabase project is paused after a longer period of inactivity and must be reactivated in the dashboard, or the network is blocking the connection.',
  unknown: 'Unerwarteter Fehler. Versuche es erneut.',
}

/** Message for the user interface. */
export function describeRoomError(error: unknown): string {
  return MESSAGES[error instanceof RoomError ? error.code : 'unknown']
}

/** Translates a database function error into a RoomError. */
export function toRoomError(error: PostgrestError): RoomError {
  const known = (ROOM_ERROR_CODES as readonly string[]).includes(error.message)
  if (known) {
    return new RoomError(error.message as RoomErrorCode, error.message, {
      cause: error,
    })
  }
  // Connection errors have no database code (fetch fails before a response arrives).
  if (!error.code && /fetch|network|load failed/i.test(error.message)) {
    return new RoomError('network', error.message, { cause: error })
  }
  return new RoomError('unknown', error.message, { cause: error })
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new RoomError('unknown', `Antwort ohne ${field}.`)
  }
  return value
}

function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new RoomError('unknown', 'Unexpected response from the database.')
  }
  return value as Record<string, unknown>
}

export type CreatedRoom = { roomId: string; inviteToken: string }

/** Creates a room and makes the caller its first member. */
export async function createRoom(
  client: AppSupabaseClient,
  displayName: string,
  roomName: string | null = null,
): Promise<CreatedRoom> {
  // Without a room name the call stays as before work package 022 and also works without the migration.
  const { data, error } = await client.rpc(
    'create_room',
    roomName === null
      ? { p_display_name: displayName }
      : { p_display_name: displayName, p_room_name: roomName },
  )
  if (error) throw toRoomError(error)
  const result = readObject(data)
  return {
    roomId: expectString(result.room_id, 'room_id'),
    inviteToken: expectString(result.invite_token, 'invite_token'),
  }
}

/**
 * Joins a room via invitation token. Repeated calls are harmless; at most they update the
 * display name.
 */
export async function joinRoom(
  client: AppSupabaseClient,
  inviteToken: string,
  displayName: string,
): Promise<{ roomId: string }> {
  const { data, error } = await client.rpc('join_room', {
    p_invite_token: inviteToken,
    p_display_name: displayName,
  })
  if (error) throw toRoomError(error)
  return { roomId: expectString(readObject(data).room_id, 'room_id') }
}

/**
 * Leaves the room. In an open round the own vote is removed; in a revealed round it stays
 * until the next round (see work package 019). Anyone who is no longer a member (e.g. after a
 * double click) counts as successfully left.
 */
export async function leaveRoom(
  client: AppSupabaseClient,
  roomId: string,
): Promise<void> {
  const { error } = await client.rpc('leave_room', { p_room_id: roomId })
  if (error) {
    const roomError = toRoomError(error)
    if (roomError.code === 'not_member') return
    throw roomError
  }
}

/** Invitation token of a room (members only), used to copy the link. */
export async function getInviteToken(
  client: AppSupabaseClient,
  roomId: string,
): Promise<string> {
  const { data, error } = await client.rpc('get_invite_token', {
    p_room_id: roomId,
  })
  if (error) throw toRoomError(error)
  return expectString(data, 'invite_token')
}
