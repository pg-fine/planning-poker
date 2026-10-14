import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/** Changes the room name (`null` removes it). Members only; returns the new state. */
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
