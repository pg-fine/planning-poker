import type { CardValue } from '../domain/cards.ts'
import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/**
 * Casts the own vote for the open round or replaces it. The user ID comes from the session on
 * the server. Errors are `RoomError`: `round_conflict` (the round changed in the meantime),
 * `round_not_open` (already revealed), `not_member`, `invalid_card`.
 */
export async function castVote(
  client: AppSupabaseClient,
  roomId: string,
  roundId: string,
  card: CardValue,
): Promise<RoomState> {
  const { data, error } = await client.rpc('cast_vote', {
    p_room_id: roomId,
    p_round_id: roundId,
    p_card: card,
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}
