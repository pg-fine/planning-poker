import type { AppSupabaseClient } from './client.ts'
import { parseRoomState, type RoomState } from './roomState.ts'
import { toRoomError } from './rooms.ts'

/**
 * Removes another member from the room (any member may do this). In an open round the removed
 * person's vote is deleted; in a revealed round it stays until the next round (see work package
 * 019). Errors as `RoomError`: `invalid_member` (not a member any more, or oneself), `not_member`.
 */
export async function removeMember(
  client: AppSupabaseClient,
  roomId: string,
  userId: string,
): Promise<RoomState> {
  const { data, error } = await client.rpc('remove_member', {
    p_room_id: roomId,
    p_user_id: userId,
  })
  if (error) throw toRoomError(error)
  return parseRoomState(data)
}
