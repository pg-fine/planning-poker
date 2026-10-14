import type { CardValue } from '../domain/cards.ts'
import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/**
 * Gibt die eigene Stimme für die offene Runde ab oder ersetzt sie. Die Nutzer-ID kommt
 * serverseitig aus der Session. Fehler als `RoomError`: `round_conflict` (Runde wurde
 * inzwischen gewechselt), `round_not_open` (schon aufgedeckt), `not_member`, `invalid_card`.
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
