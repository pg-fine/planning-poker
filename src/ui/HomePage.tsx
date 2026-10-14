import { useState, type FormEvent } from 'react'
import { checkDisplayName, checkRoomName, MAX_ROOM_NAME_LENGTH } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { createRoom, describeRoomError } from '../supabase/rooms.ts'
import { NameField } from './NameField.tsx'
import { navigate, roomPath } from './routing.ts'
import { Link } from './Link.tsx'
import {
  loadDisplayName,
  loadRecentRooms,
  rememberRoom,
  type RecentRoom,
  removeRecentRoom,
  saveDisplayName,
  touchRecentRoom,
} from './storage.ts'

const dateTime = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })

function recentLabel(room: RecentRoom): string {
  return room.roomName || `Raum …${room.token.slice(-6)}`
}

export function HomePage({ client }: { client: AppSupabaseClient }) {
  const [name, setName] = useState(loadDisplayName)
  const [roomName, setRoomName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recent, setRecent] = useState(loadRecentRooms)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const check = checkDisplayName(name)
    if (!check.ok) {
      setError(check.message)
      return
    }
    const roomCheck = checkRoomName(roomName)
    if (!roomCheck.ok) {
      setError(roomCheck.message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { roomId, inviteToken } = await createRoom(client, check.name, roomCheck.name)
      saveDisplayName(check.name)
      rememberRoom(inviteToken, roomId, check.name)
      if (roomCheck.name) touchRecentRoom(inviteToken, undefined, roomCheck.name)
      navigate(roomPath(inviteToken))
    } catch (caught) {
      setError(describeRoomError(caught))
      setBusy(false)
    }
  }

  const forget = (token: string) => {
    removeRecentRoom(token)
    setRecent(loadRecentRooms())
  }

  return (
    <>
      {recent.length > 0 && (
        <section className="card" aria-labelledby="recent-title">
          <h2 id="recent-title">Zuletzt verwendete Räume</h2>
          <ul className="recent-list">
            {recent.map((room) => (
              <li key={room.token}>
                <Link to={roomPath(room.token)}>{recentLabel(room)}</Link>
                <span className="hint">
                  {' '}
                  · zuletzt geöffnet {dateTime.format(room.lastUsed)}
                  {room.displayName && `, als ${room.displayName}`}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => forget(room.token)}
                  aria-label={`${recentLabel(room)} aus der Liste entfernen`}
                >
                  Entfernen
                </button>
              </li>
            ))}
          </ul>
          <p className="hint">
            Die Liste steht nur in diesem Browser. „Entfernen“ löscht den Eintrag hier, nicht den Raum.
          </p>
        </section>
      )}

      <section className="card" aria-labelledby="home-title">
        <h2 id="home-title">Neuen Raum erstellen</h2>
        <p>
          Du erhältst einen Link, den du im Teams-Chat teilen kannst. Wer ihn öffnet, gibt
          einen Namen ein und schätzt mit. Der Link bleibt dauerhaft gültig.
        </p>
        <form onSubmit={onSubmit} noValidate>
          <NameField value={name} onChange={setName} readOnly={busy} />
          <div className="field">
            <label htmlFor="room-name-input">Raumname (optional)</label>
            <input
              id="room-name-input"
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              maxLength={MAX_ROOM_NAME_LENGTH}
              placeholder="z. B. Team Atlas – Refinement"
              readOnly={busy}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" aria-disabled={busy || undefined}>
            {busy ? 'Raum wird erstellt …' : 'Raum erstellen'}
          </button>
        </form>
        <p className="hint">
          Hast du einen Einladungslink? Öffne ihn einfach in diesem Browser.
        </p>
      </section>
    </>
  )
}
