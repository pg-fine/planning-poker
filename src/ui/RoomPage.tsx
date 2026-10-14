import { useEffect, useState, type FormEvent } from 'react'
import { checkDisplayName } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { RoomError, describeRoomError, joinRoom } from '../supabase/rooms.ts'
import { NameField } from './NameField.tsx'
import { NoticePage } from './NoticePage.tsx'
import { RoomView } from './RoomView.tsx'
import { navigate } from './routing.ts'
import {
  forgetRoom,
  loadDisplayName,
  loadKnownRoom,
  rememberRoom,
  saveDisplayName,
  touchRecentRoom,
} from './storage.ts'

type Props = { client: AppSupabaseClient; token: string }

/**
 * Room link: if this browser has already joined the room, it opens directly; otherwise the
 * join form appears. Use with `key={token}` so the state starts fresh when switching to
 * another link.
 */
export function RoomPage({ client, token }: Props) {
  const [roomId, setRoomId] = useState<string | null>(() => loadKnownRoom(token))
  const [name, setName] = useState(loadDisplayName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidToken, setInvalidToken] = useState(false)

  // Already known room: move it to the front of the recently used rooms list.
  const known = roomId !== null
  useEffect(() => {
    if (known) touchRecentRoom(token)
  }, [known, token])

  if (invalidToken) {
    return (
      <NoticePage title="This invitation link is invalid.">
        Check that the link was copied completely, or ask for a new link.
      </NoticePage>
    )
  }

  if (roomId) {
    return (
      <RoomView
        client={client}
        roomId={roomId}
        token={token}
        onNotMember={() => {
          forgetRoom(token)
          setRoomId(null)
        }}
        onLeft={() => {
          forgetRoom(token)
          navigate('/')
        }}
      />
    )
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const check = checkDisplayName(name)
    if (!check.ok) {
      setError(check.message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const joined = await joinRoom(client, token, check.name)
      saveDisplayName(check.name)
      rememberRoom(token, joined.roomId, check.name)
      setRoomId(joined.roomId)
    } catch (caught) {
      if (caught instanceof RoomError && caught.code === 'invalid_token') {
        setInvalidToken(true)
        return
      }
      setError(describeRoomError(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="join-title">
      <h2 id="join-title">Join room</h2>
      <p>You have been invited to an estimation round. Enter your name to take part.</p>
      <form onSubmit={onSubmit} noValidate>
        <NameField value={name} onChange={setName} readOnly={busy} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" aria-disabled={busy || undefined}>
          {busy ? 'Joining …' : 'Join'}
        </button>
      </form>
    </section>
  )
}
