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
 * Raum-Link: Ist dieser Browser dem Raum schon beigetreten, wird er direkt geöffnet,
 * sonst erscheint das Beitrittsformular. Mit `key={token}` einsetzen, damit der Zustand
 * beim Wechsel zu einem anderen Link neu beginnt.
 */
export function RoomPage({ client, token }: Props) {
  const [roomId, setRoomId] = useState<string | null>(() => loadKnownRoom(token))
  const [name, setName] = useState(loadDisplayName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invalidToken, setInvalidToken] = useState(false)

  // Bereits bekannter Raum: in der Liste der zuletzt verwendeten Räume nach vorn holen.
  const known = roomId !== null
  useEffect(() => {
    if (known) touchRecentRoom(token)
  }, [known, token])

  if (invalidToken) {
    return (
      <NoticePage title="Dieser Einladungslink ist ungültig.">
        Prüfe, ob der Link vollständig kopiert wurde, oder bitte um einen neuen Link.
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
      <h2 id="join-title">Raum beitreten</h2>
      <p>Du wurdest zu einer Schätzrunde eingeladen. Gib deinen Namen ein, um mitzumachen.</p>
      <form onSubmit={onSubmit} noValidate>
        <NameField value={name} onChange={setName} readOnly={busy} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" aria-disabled={busy || undefined}>
          {busy ? 'Du trittst bei …' : 'Beitreten'}
        </button>
      </form>
    </section>
  )
}
