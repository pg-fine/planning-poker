import { useState, type FormEvent } from 'react'
import { MAX_ROOM_NAME_LENGTH, checkRoomName } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import type { RoomState } from '../supabase/roomState.ts'
import { setRoomName } from '../supabase/roomName.ts'
import { describeRoomError } from '../supabase/rooms.ts'

type Props = {
  client: AppSupabaseClient
  roomId: string
  currentName: string | null
  onState: (state: RoomState) => void
  offline: boolean
}

/** Set, change or (when empty) remove the room name. For all members. */
export function RoomNameChange({ client, roomId, currentName, onState, offline }: Props) {
  const [name, setName] = useState(currentName ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const check = checkRoomName(name)
    if (!check.ok) {
      setMessage({ text: check.message, error: true })
      return
    }
    if (check.name === currentName) {
      setMessage({ text: 'The room name is already set to this.', error: false })
      return
    }
    if (offline) {
      setMessage({ text: 'No connection. Try again once it is back.', error: true })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      onState(await setRoomName(client, roomId, check.name))
      setName(check.name ?? '')
      setMessage({ text: check.name ? 'Room name changed.' : 'Room name removed.', error: false })
    } catch (caught) {
      setMessage({ text: describeRoomError(caught), error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="room-name-change">Room name</label>
        <input
          id="room-name-change"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_ROOM_NAME_LENGTH}
          placeholder="e.g. Team Atlas – Refinement"
          readOnly={busy}
        />
      </div>
      <button type="submit" className="secondary" aria-disabled={busy || undefined}>
        {busy ? 'Saving …' : 'Save room name'}
      </button>
      {message && (
        <p className={message.error ? 'error' : 'hint'} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
