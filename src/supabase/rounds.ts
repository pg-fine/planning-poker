import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/**
 * Startet eine neue Runde und ersetzt die bisherige samt Stimmen.
 *
 * `expectedRoundId` ist die Runden-ID, die diese Ansicht zuletzt gesehen hat (`null`, wenn
 * es noch keine gab). Hat inzwischen jemand anderes gewechselt, wirft die Funktion
 * `RoomError` mit Code `round_conflict`, und die neuere Runde bleibt unverändert.
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
 * Deckt die angegebene Runde auf. Wiederholtes Aufdecken ist unschädlich. Gehört die
 * Runden-ID nicht mehr zur aktuellen Runde, wirft die Funktion `round_conflict`.
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
