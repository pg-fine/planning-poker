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

const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

function recentLabel(room: RecentRoom): string {
  return room.roomName || `Room …${room.token.slice(-6)}`
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
          <h2 id="recent-title">Recently used rooms</h2>
          <ul className="recent-list">
            {recent.map((room) => (
              <li key={room.token}>
                <Link to={roomPath(room.token)}>{recentLabel(room)}</Link>
                <span className="hint">
                  {' '}
                  · last opened {dateTime.format(room.lastUsed)}
                  {room.displayName && `, as ${room.displayName}`}
                </span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => forget(room.token)}
                  aria-label={`Remove ${recentLabel(room)} from the list`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p className="hint">
            The list is only stored in this browser. "Remove" deletes the entry here, not the room.
          </p>
        </section>
      )}

      <section className="card" aria-labelledby="home-title">
        <h2 id="home-title">Create a new room</h2>
        <p>
          You get a link you can share in the Teams chat. Whoever opens it enters a
          name and estimates along. The link stays valid permanently.
        </p>
        <form onSubmit={onSubmit} noValidate>
          <NameField value={name} onChange={setName} readOnly={busy} />
          <div className="field">
            <label htmlFor="room-name-input">Room name (optional)</label>
            <input
              id="room-name-input"
              type="text"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              maxLength={MAX_ROOM_NAME_LENGTH}
              placeholder="e.g. Team Atlas – Refinement"
              readOnly={busy}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" aria-disabled={busy || undefined}>
            {busy ? 'Creating room …' : 'Create room'}
          </button>
        </form>
        <p className="hint">
          Have an invitation link? Just open it in this browser.
        </p>
      </section>
    </>
  )
}
