import { useEffect, useRef, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { RoomError, describeRoomError, leaveRoom } from '../supabase/rooms.ts'
import { roomUrl } from './routing.ts'
import { RoundPanel } from './RoundPanel.tsx'
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
  const { result, reload, applyState, connection, browserOnline } = useRoomState(
    client,
    roomId,
  )
  const link = roomUrl(token)
  const linkField = useRef<HTMLInputElement>(null)
  const top = useRef<HTMLDivElement>(null)
  const details = useRef<HTMLDetailsElement>(null)
  const isReady = result.status === 'ready'
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

  // Beim ersten Anzeigen des Raums den Fokus an den Anfang setzen (der Beitritts-Knopf ist weg).
  useEffect(() => {
    if (isReady) top.current?.focus({ preventScroll: true })
  }, [isReady])

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
      // Zwischenablage gesperrt: Link sichtbar machen und markieren, damit er von Hand kopiert werden kann.
      if (details.current) details.current.open = true
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

  const statusText =
    connection === 'live'
      ? '● Live'
      : connection === 'connecting'
        ? '○ Verbindung wird hergestellt …'
        : '▲ Keine Live-Verbindung'

  return (
    <div ref={top} tabIndex={-1} className="focus-target">
      <div className="room-bar">
        <p className="room-bar__who">
          Du bist als <strong>{state.me.displayName}</strong> dabei
        </p>
        <p
          className={`room-bar__status${connection === 'live' ? '' : ' room-bar__status--warn'}`}
          role="status"
        >
          {statusText}
        </p>
        <button type="button" onClick={copyLink}>
          Einladen
        </button>
      </div>
      {copyMessage && (
        <p className="hint" role="status">
          {copyMessage}
        </p>
      )}
      {connection === 'offline' && (
        <p className="card card--notice" role="status">
          {browserOnline
            ? 'Keine Live-Verbindung. Der Stand wird alle paar Sekunden abgefragt, Änderungen erscheinen mit kurzer Verzögerung.'
            : 'Keine Verbindung. Aktionen sind pausiert; deine gespeicherte Stimme bleibt erhalten. Sobald die Verbindung zurück ist, wird der Stand automatisch aktualisiert.'}
        </p>
      )}

      <div className="room-layout">
        <div className="room-layout__main">
          <RoundPanel
            client={client}
            state={state}
            onState={applyState}
            offline={!browserOnline}
          />
        </div>

        <aside className="card room-layout__side" aria-labelledby="members-title">
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
            Alle, die diesem Raum beigetreten sind, nicht nur wer gerade online ist.
          </p>
        </aside>
      </div>

      <details className="card room-details" ref={details}>
        <summary>Raum und Hilfe</summary>
        <div className="field">
          <label htmlFor="invite-link">Einladungslink</label>
          <div className="row">
            <input id="invite-link" ref={linkField} type="text" readOnly value={link} />
            <button type="button" onClick={copyLink}>
              Link kopieren
            </button>
          </div>
          <p className="hint">Teile diesen Link im Teams-Chat. Er bleibt dauerhaft gültig.</p>
        </div>
        <p className="hint">
          Beim Verlassen wird deine Stimme entfernt. Mit dem Link kannst du jederzeit erneut
          beitreten.
        </p>
        {leaveError && (
          <p className="error" role="alert">
            {leaveError}
          </p>
        )}
        <button
          type="button"
          className="secondary"
          onClick={leave}
          aria-disabled={leaving || undefined}
        >
          {leaving ? 'Raum wird verlassen …' : 'Raum verlassen'}
        </button>
      </details>
    </div>
  )
}
