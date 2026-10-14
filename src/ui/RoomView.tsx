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
  /** The person is (no longer) a member of this room. */
  onNotMember: () => void
  /** The person has deliberately left the room. */
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

  // Membership is missing, e.g. after a new browser identity: back to the join form.
  const notMember =
    result.status === 'error' &&
    result.error instanceof RoomError &&
    result.error.code === 'not_member'
  useEffect(() => {
    if (notMember) onNotMember()
  }, [notMember, onNotMember])

  // When the room is first shown, move focus to the start (the join button is gone).
  useEffect(() => {
    if (isReady) top.current?.focus({ preventScroll: true })
  }, [isReady])

  // Keep the room name in the "Recently used rooms" list up to date.
  const roomName = result.status === 'ready' ? result.state.name : undefined
  useEffect(() => {
    if (roomName !== undefined) touchRecentRoom(token, undefined, roomName)
  }, [token, roomName])

  if (notMember) return null

  if (result.status === 'loading') {
    return (
      <section className="card" aria-live="polite">
        <p>Loading room …</p>
      </section>
    )
  }

  if (result.status === 'error') {
    return (
      <section className="card card--notice" role="alert">
        <h2>The room could not be loaded.</h2>
        <p>{describeRoomError(result.error)}</p>
        <button type="button" onClick={reload}>
          Try again
        </button>
      </section>
    )
  }

  const { state } = result

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopyMessage('Link copied.')
    } catch {
      // Clipboard blocked: make the link visible and select it so it can be copied by hand.
      if (details.current) details.current.open = true
      linkField.current?.select()
      setCopyMessage('Copying is not possible. The link is selected, copy it with Ctrl+C.')
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
        ? '○ Connecting …'
        : '▲ No live connection'

  return (
    <div ref={top} tabIndex={-1} className="focus-target">
      {state.name && <h2 className="room-name">{state.name}</h2>}
      <div className="room-bar">
        <p className="room-bar__who">
          You are taking part as <strong>{state.me.displayName}</strong> ·{' '}
          <Link to="/">Back to home</Link>
        </p>
        <p
          className={`room-bar__status${connection === 'live' ? '' : ' room-bar__status--warn'}`}
          role="status"
        >
          {statusText}
        </p>
        <button type="button" onClick={copyLink}>
          Invite
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
            ? 'No live connection. The state is polled every few seconds; changes appear with a short delay.'
            : 'No connection. Actions are paused; your saved vote is kept. As soon as the connection is back, the state is updated automatically.'}
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
        <summary>Room and help</summary>
        <div className="field">
          <label htmlFor="invite-link">Invitation link</label>
          <div className="row">
            <input id="invite-link" ref={linkField} type="text" readOnly value={link} />
            <button type="button" onClick={copyLink}>
              Copy link
            </button>
          </div>
          <p className="hint">Share this link in the Teams chat. It stays valid permanently.</p>
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
        <h3 className="results-heading">Remove participation</h3>
        <p className="hint">
          "Back to home" only leaves this view; your participation and your vote are kept.
          "Remove participation" deletes you from the member list. Your vote is removed in an
          open round; in an already revealed result it stays, together with your name, until the
          next round. You can join again at any time with the link.
        </p>
        {leaveError && (
          <p className="error" role="alert">
            {leaveError}
          </p>
        )}
        {confirmLeave ? (
          <div className="confirm" role="alert">
            <p>
              <strong>Really remove your participation?</strong> A vote in the open round will be
              deleted.
            </p>
            <div className="row">
              <button type="button" onClick={leave} aria-disabled={leaving || undefined}>
                {leaving ? 'Removing …' : 'Yes, remove'}
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmLeave(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="secondary" onClick={() => setConfirmLeave(true)}>
            Remove participation
          </button>
        )}
      </details>
    </div>
  )
}
