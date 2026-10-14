import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/** Ändert den Raumnamen (`null` entfernt ihn). Nur für Mitglieder; liefert den neuen Zustand. */
export async function setRoomName(
  client: AppSupabaseClient,
  roomId: string,
  name: string | null,
): Promise<RoomState> {
  const { data, error } = await client.rpc('set_room_name', {
    p_room_id: roomId,
    p_name: name ?? '',
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}
