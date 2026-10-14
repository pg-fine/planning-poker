import { useEffect, useRef, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState } from '../supabase/roomState.ts'
import { RoomError, describeRoomError, leaveRoom } from '../supabase/rooms.ts'
import { Link } from './Link.tsx'
import { RoomNameChange } from './RoomNameChange.tsx'
import { Participants } from './Participants.tsx'
import { NameChange } from './NameChange.tsx'
import { roomUrl } from './routing.ts'
import { touchRecentRoom } from './storage.ts'
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
  const { result, reload, applyState, connection, browserOnline, onlineIds } = useRoomState(
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
  const [confirmLeave, setConfirmLeave] = useState(false)
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

  // Raumnamen in der Liste „Zuletzt verwendete Räume“ aktuell halten.
  const roomName = result.status === 'ready' ? result.state.name : undefined
  useEffect(() => {
    if (roomName !== undefined) touchRecentRoom(token, undefined, roomName)
  }, [token, roomName])

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
      setConfirmLeave(false)
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
      {state.name && <h2 className="room-name">{state.name}</h2>}
      <div className="room-bar">
        <p className="room-bar__who">
          Du bist als <strong>{state.me.displayName}</strong> dabei ·{' '}
          <Link to="/">Zur Startseite</Link>
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

        <Participants state={state} onlineIds={connection === 'live' ? onlineIds : null} />
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
        <RoomNameChange
          client={client}
          roomId={roomId}
          currentName={state.name}
          onState={applyState}
          offline={!browserOnline}
        />
        <NameChange
          client={client}
          token={token}
          currentName={state.me.displayName}
          offline={!browserOnline}
          onChanged={() => {
            void getRoomState(client, roomId).then(applyState, () => {})
          }}
        />
        <h3 className="results-heading">Teilnahme entfernen</h3>
        <p className="hint">
          „Zur Startseite“ verlässt nur diese Ansicht; deine Teilnahme und deine Stimme bleiben
          erhalten. „Teilnahme entfernen“ löscht dich aus der Mitgliederliste. Deine Stimme wird in einer
          offenen Runde entfernt; in einem bereits aufgedeckten Ergebnis bleibt sie samt Namen bis
          zur nächsten Runde stehen. Mit dem Link kannst du jederzeit erneut beitreten.
        </p>
        {leaveError && (
          <p className="error" role="alert">
            {leaveError}
          </p>
        )}
        {confirmLeave ? (
          <div className="confirm" role="alert">
            <p>
              <strong>Teilnahme wirklich entfernen?</strong> Eine Stimme in der offenen Runde wird
              gelöscht.
            </p>
            <div className="row">
              <button type="button" onClick={leave} aria-disabled={leaving || undefined}>
                {leaving ? 'Wird entfernt …' : 'Ja, entfernen'}
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmLeave(false)}>
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="secondary" onClick={() => setConfirmLeave(true)}>
            Teilnahme entfernen
          </button>
        )}
      </details>
    </div>
  )
}
