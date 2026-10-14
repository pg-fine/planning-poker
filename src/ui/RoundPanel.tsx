import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { CardValue } from '../domain/cards.ts'
import { MAX_TITLE_LENGTH } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'
import { RoomError, describeRoomError } from '../supabase/rooms.ts'
import { revealRound, startRound } from '../supabase/rounds.ts'
import { castVote } from '../supabase/votes.ts'
import { CardDeck } from './CardDeck.tsx'
import { RevealedResults } from './RevealedResults.tsx'

type Props = {
  client: AppSupabaseClient
  state: RoomState
  onState: (state: RoomState) => void
  /** Keine Verbindung: Aktionen sind gesperrt, bis sie wieder besteht. */
  offline: boolean
}

/** Antwort blieb aus oder Verbindung brach ab: Die Aktion ist möglicherweise angekommen. */
function isUnclear(error: unknown): boolean {
  return (
    !(error instanceof RoomError) ||
    error.code === 'network' ||
    error.code === 'unknown'
  )
}

/** Fehler, nach denen die Ansicht neu geladen wird, weil sich die Runde inzwischen geändert hat. */
function isStaleRound(error: unknown): boolean {
  return (
    error instanceof RoomError &&
    (error.code === 'round_conflict' || error.code === 'round_not_open')
  )
}

export function RoundPanel({ client, state, onState, offline }: Props) {
  const { round } = state
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)

  // Beim Aufdecken verschwindet der fokussierte Knopf. Ist der Fokus dann verloren, setzen wir ihn auf
  // das Ergebnis, damit Tastatur- und Screenreader-Nutzende dort weitermachen. Wer gerade in einem
  // Feld tippt, behält den Fokus.
  const revealed = round?.status === 'revealed'
  useEffect(() => {
    if (revealed && (!document.activeElement || document.activeElement === document.body)) {
      heading.current?.focus({ preventScroll: true })
    }
  }, [revealed, round?.roundId])

  const myVote = round?.votes.find((vote) => vote.userId === state.me.userId)?.card ?? null

  /**
   * Führt eine Aktion aus und übernimmt erst deren bestätigten Zustand.
   *
   * Bei unklarer Antwort (Verbindungsabbruch) wird die Aktion nie blind wiederholt. Stattdessen
   * wird der Stand geladen; `wasApplied` entscheidet, ob die Aktion dort bereits sichtbar ist.
   */
  const run = async (
    action: () => Promise<RoomState>,
    wasApplied?: (fresh: RoomState) => boolean,
  ): Promise<boolean> => {
    if (busy) return false
    if (offline) {
      setError('Keine Verbindung. Sobald sie wieder besteht, kannst du weitermachen.')
      return false
    }
    setBusy(true)
    setError(null)
    try {
      onState(await action())
      return true
    } catch (caught) {
      let message = describeRoomError(caught)
      if (isUnclear(caught)) {
        try {
          const fresh = await getRoomState(client, state.roomId)
          onState(fresh)
          if (wasApplied?.(fresh)) return true
          message =
            'Die Verbindung wurde unterbrochen. Der aktuelle Stand wurde geladen; deine Aktion ist nicht angekommen. Versuche es erneut.'
        } catch {
          message =
            'Keine Verbindung zu Supabase. Deine Aktion ist möglicherweise nicht angekommen. Prüfe den Stand, sobald die Verbindung wieder besteht.'
        }
      } else if (isStaleRound(caught)) {
        try {
          onState(await getRoomState(client, state.roomId))
          message += ' Die Ansicht wurde aktualisiert.'
        } catch {
          // Aktualisierung fehlgeschlagen: die ursprüngliche Meldung genügt.
        }
      }
      setError(message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const onStart = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') {
      setError('Bitte gib einen Titel für die Schätzung ein.')
      return
    }
    if ([...trimmed].length > MAX_TITLE_LENGTH) {
      setError(`Der Titel darf höchstens ${MAX_TITLE_LENGTH} Zeichen lang sein.`)
      return
    }
    const started = await run(
      () => startRound(client, state.roomId, round?.roundId ?? null, trimmed),
      (fresh) =>
        fresh.round !== null &&
        fresh.round.roundId !== (round?.roundId ?? null) &&
        fresh.round.title === trimmed,
    )
    if (started) setTitle('')
  }

  const onVote = (card: CardValue) => {
    if (!round) return
    void run(
      () => castVote(client, state.roomId, round.roundId, card),
      (fresh) =>
        fresh.round?.roundId === round.roundId &&
        fresh.round.votes.some((vote) => vote.userId === state.me.userId && vote.card === card),
    )
  }

  const onReveal = () => {
    if (!round) return
    void run(
      () => revealRound(client, state.roomId, round.roundId),
      (fresh) => fresh.round?.roundId === round.roundId && fresh.round.status === 'revealed',
    )
  }

  return (
    <>
      {round && (
        <section className="card" aria-labelledby="round-title">
          <p className="hint">{round.status === 'open' ? 'Abstimmung läuft' : 'Aufgedeckt'}</p>
          <h2 id="round-title" className="round-title" ref={heading} tabIndex={-1}>
            {round.title}
          </h2>

          {round.status === 'open' ? (
            <>
              <CardDeck selected={myVote} busy={busy} disabled={offline} onSelect={onVote} />
              <p role="status">
                {myVote === null
                  ? 'Du hast noch nicht abgestimmt.'
                  : 'Deine Stimme ist gespeichert. Du kannst sie bis zum Aufdecken ändern.'}{' '}
                Abgegebene Stimmen: <strong>{round.votes.length}</strong>
              </p>
              <button
                type="button"
                onClick={onReveal}
                disabled={offline}
                aria-disabled={busy || undefined}
              >
                {busy ? 'Wird gespeichert …' : 'Karten aufdecken'}
              </button>
            </>
          ) : (
            <RevealedResults votes={round.votes} members={state.members} />
          )}
        </section>
      )}

      <section className="card" aria-labelledby="start-title">
        <h2 id="start-title">{round ? 'Neue Runde' : 'Erste Runde starten'}</h2>
        {round?.status === 'open' && round.votes.length > 0 && (
          <p className="hint">
            Eine neue Runde ersetzt die laufende Abstimmung samt aller bisherigen Stimmen.
          </p>
        )}
        <form onSubmit={onStart} noValidate>
          <div className="field">
            <label htmlFor="round-title-input">Titel der Schätzung</label>
            <input
              id="round-title-input"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="z. B. STORY-123 Login-Seite"
              readOnly={busy}
            />
          </div>
          <button type="submit" disabled={offline} aria-disabled={busy || undefined}>
            {busy ? 'Wird gespeichert …' : round ? 'Neue Runde starten' : 'Runde starten'}
          </button>
        </form>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
