import { useEffect, useRef, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { RoomError, describeRoomError, leaveRoom } from '../supabase/rooms.ts'
import { roomUrl } from './routing.ts'
import { useRoomState } from './useRoomState.ts'

type Props = {
  client: AppSupabaseClient
  roomId: string
  token: string
  /** Die Person ist (nicht mehr) Mitglied dieses Raums. */
  onNotMember: () => void
  /** Die Person hat den Raum bewusst verlassen. */
  onLeft: () => void
}

export function RoomView({ client, roomId, token, onNotMember, onLeft }: Props) {
  const { result, reload } = useRoomState(client, roomId)
  const link = roomUrl(token)
  const linkField = useRef<HTMLInputElement>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  // Mitgliedschaft fehlt, z. B. nach neuer Browser-Identität: zurück zum Beitrittsformular.
  const notMember =
    result.status === 'error' &&
    result.error instanceof RoomError &&
    result.error.code === 'not_member'
  useEffect(() => {
    if (notMember) onNotMember()
  }, [notMember, onNotMember])

  if (notMember) return null

  if (result.status === 'loading') {
    return (
      <section className="card" aria-live="polite">
        <p>Raum wird geladen …</p>
      </section>
    )
  }

  if (result.status === 'error') {
    return (
      <section className="card card--notice" role="alert">
        <h2>Der Raum konnte nicht geladen werden.</h2>
        <p>{describeRoomError(result.error)}</p>
        <button type="button" onClick={reload}>
          Erneut versuchen
        </button>
      </section>
    )
  }

  const { state } = result

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopyMessage('Link kopiert.')
    } catch {
      // Zwischenablage gesperrt: Link markieren, damit er von Hand kopiert werden kann.
      linkField.current?.select()
      setCopyMessage('Kopieren nicht möglich. Der Link ist markiert, kopiere ihn mit Strg+C.')
    }
  }

  const leave = async () => {
    if (leaving) return
    setLeaving(true)
    setLeaveError(null)
    try {
      await leaveRoom(client, roomId)
      onLeft()
    } catch (caught) {
      setLeaveError(describeRoomError(caught))
      setLeaving(false)
    }
  }

  return (
    <>
      <section className="card" aria-labelledby="room-title">
        <h2 id="room-title">Dein Raum</h2>
        <p>
          Du bist als <strong>{state.me.displayName}</strong> dabei.
        </p>

        <div className="field">
          <label htmlFor="invite-link">Einladungslink</label>
          <div className="row">
            <input id="invite-link" ref={linkField} type="text" readOnly value={link} />
            <button type="button" onClick={copyLink}>
              Link kopieren
            </button>
          </div>
          <p className="hint" role="status">
            {copyMessage ?? 'Teile diesen Link im Teams-Chat. Er bleibt dauerhaft gültig.'}
          </p>
        </div>
      </section>

      <section className="card" aria-labelledby="members-title">
        <h2 id="members-title">Mitglieder ({state.members.length})</h2>
        <ul className="member-list">
          {state.members.map((member) => (
            <li key={member.userId}>
              {member.displayName}
              {member.userId === state.me.userId ? ' (du)' : ''}
            </li>
          ))}
        </ul>
        <p className="hint">
          Das sind alle, die diesem Raum beigetreten sind, nicht nur wer gerade online ist.
        </p>
      </section>

      <section className="card">
        <p className="hint">
          Beim Verlassen wird deine Stimme entfernt. Mit dem Link kannst du jederzeit erneut
          beitreten.
        </p>
        {leaveError && (
          <p className="error" role="alert">
            {leaveError}
          </p>
        )}
        <button type="button" className="secondary" onClick={leave} disabled={leaving}>
          {leaving ? 'Raum wird verlassen …' : 'Raum verlassen'}
        </button>
      </section>
    </>
  )
}
