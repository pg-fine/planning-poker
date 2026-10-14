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

/** Raumnamen setzen, ändern oder (leer) entfernen. Für alle Mitglieder. */
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
      setMessage({ text: 'Der Raumname ist bereits so gesetzt.', error: false })
      return
    }
    if (offline) {
      setMessage({ text: 'Keine Verbindung. Versuche es erneut, sobald sie besteht.', error: true })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      onState(await setRoomName(client, roomId, check.name))
      setName(check.name ?? '')
      setMessage({ text: check.name ? 'Raumname geändert.' : 'Raumname entfernt.', error: false })
    } catch (caught) {
      setMessage({ text: describeRoomError(caught), error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="room-name-change">Raumname</label>
        <input
          id="room-name-change"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_ROOM_NAME_LENGTH}
          placeholder="z. B. Team Atlas – Refinement"
          readOnly={busy}
        />
      </div>
      <button type="submit" className="secondary" aria-disabled={busy || undefined}>
        {busy ? 'Wird gespeichert …' : 'Raumnamen speichern'}
      </button>
      {message && (
        <p className={message.error ? 'error' : 'hint'} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
