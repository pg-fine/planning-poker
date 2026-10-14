import { isCardValue, type CardValue } from '../domain/cards.ts'
import type { AppSupabaseClient } from './client.ts'
import { RoomError, toRoomError } from './rooms.ts'

export type Member = { userId: string; displayName: string }
/** `displayName` is only set if the person removed their participation after the reveal. */
export type Vote = { userId: string; card: CardValue; displayName?: string }

export type RoundState = {
  roundId: string
  title: string
  status: 'open' | 'revealed'
  votes: Vote[]
}

/** State of a room from the caller's point of view (see contract, section 5). */
export type RoomState = {
  roomId: string
  /** Optional room name; `null` if the room has none. */
  name: string | null
  /** Increases with every visible change; used to detect stale responses. */
  revision: number
  me: Member
  /** Members of the room. Not an online list and not a list of required voters. */
  members: Member[]
  round: RoundState | null
}

function invalid(what: string): never {
  throw new RoomError('unknown', `Unexpected response from the database: ${what}.`)
}

function asObject(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    invalid(what)
  }
  return value as Record<string, unknown>
}

function asString(value: unknown, what: string): string {
  if (typeof value !== 'string') invalid(what)
  return value
}

function asArray(value: unknown, what: string): unknown[] {
  if (!Array.isArray(value)) invalid(what)
  return value
}

function parseMember(value: unknown): Member {
  const object = asObject(value, 'member')
  return {
    userId: asString(object.user_id, 'user_id'),
    displayName: asString(object.display_name, 'display_name'),
  }
}

/** Validates and translates the JSON response of the database functions. */
export function parseRoomState(data: unknown): RoomState {
  const object = asObject(data, 'room state')
  if (typeof object.revision !== 'number') invalid('revision')

  let round: RoundState | null = null
  if (object.round !== null) {
    const raw = asObject(object.round, 'round')
    const status = raw.status
    if (status !== 'open' && status !== 'revealed') invalid('status')
    round = {
      roundId: asString(raw.round_id, 'round_id'),
      title: asString(raw.title, 'title'),
      status,
      votes: asArray(raw.votes, 'votes').map((entry): Vote => {
        const vote = asObject(entry, 'vote')
        if (!isCardValue(vote.card)) invalid('card')
        const userId = asString(vote.user_id, 'user_id')
        return typeof vote.display_name === 'string'
          ? { userId, card: vote.card, displayName: vote.display_name }
          : { userId, card: vote.card }
      }),
    }
  }

  return {
    roomId: asString(object.room_id, 'room_id'),
    name: typeof object.name === 'string' ? object.name : null,
    revision: object.revision,
    me: parseMember(object.me),
    members: asArray(object.members, 'members').map(parseMember),
    round,
  }
}

/** Loads the current state of the room (members only). */
export async function getRoomState(
  client: AppSupabaseClient,
  roomId: string,
): Promise<RoomState> {
  const { data, error } = await client.rpc('get_room_state', {
    p_room_id: roomId,
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}
