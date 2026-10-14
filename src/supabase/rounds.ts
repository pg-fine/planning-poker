import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/**
 * Starts a new round and replaces the previous one including its votes.
 *
 * `expectedRoundId` is the round ID this view last saw (`null` if there was none yet). If
 * someone else has switched rounds in the meantime, the function throws a `RoomError` with
 * code `round_conflict`, and the newer round stays unchanged.
 */
export async function startRound(
  client: AppSupabaseClient,
  roomId: string,
  expectedRoundId: string | null,
  title: string,
): Promise<RoomState> {
  const { data, error } = await client.rpc('start_round', {
    p_room_id: roomId,
    p_expected_round_id: expectedRoundId,
    p_title: title,
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}

/**
 * Reveals the given round. Revealing repeatedly is harmless. If the round ID no longer belongs
 * to the current round, the function throws `round_conflict`.
 */
export async function revealRound(
  client: AppSupabaseClient,
  roomId: string,
  roundId: string,
): Promise<RoomState> {
  const { data, error } = await client.rpc('reveal_round', {
    p_room_id: roomId,
    p_round_id: roundId,
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}
