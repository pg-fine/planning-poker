import { useEffect, useRef, useState, type FormEvent } from 'react'
import { cardDescription, type CardValue } from '../domain/cards.ts'
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

/** Bereich, in dem eine Aktion läuft bzw. ihre Rückmeldung erscheint. */
type Scope = 'vote' | 'reveal' | 'start'

export function RoundPanel({ client, state, onState, offline }: Props) {
  const { round } = state
  const [busyScope, setBusyScope] = useState<Scope | null>(null)
  const busy = busyScope !== null
  const [errors, setErrors] = useState<Partial<Record<Scope, string>>>({})
  const [pendingCard, setPendingCard] = useState<CardValue | null>(null)
  const [title, setTitle] = useState('')
  // Die Rückfrage gilt nur für die Runde, bei der sie gestellt wurde.
  const [confirmFor, setConfirmFor] = useState<string | null>(null)
  const confirmReplace = round !== null && confirmFor === round.roundId
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
    scope: Scope,
    action: () => Promise<RoomState>,
    wasApplied?: (fresh: RoomState) => boolean,
  ): Promise<boolean> => {
    if (busy) return false
    if (offline) {
      setErrors({ [scope]: 'Keine Verbindung. Sobald sie wieder besteht, kannst du weitermachen.' })
      return false
    }
    setBusyScope(scope)
    setErrors({})
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
      setErrors({ [scope]: message })
      return false
    } finally {
      setBusyScope(null)
    }
  }

  /** Startet eine neue Runde mit dem Titel; bei Erfolg ist die Rückfrage erledigt. */
  const startWith = async (newTitle: string): Promise<boolean> => {
    const started = await run(
      'start',
      () => startRound(client, state.roomId, round?.roundId ?? null, newTitle),
      (fresh) =>
        fresh.round !== null &&
        fresh.round.roundId !== (round?.roundId ?? null) &&
        fresh.round.title === newTitle,
    )
    if (started) {
      setConfirmFor(null)
      setTitle('')
    }
    return started
  }

  const onStart = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (trimmed === '') {
      setErrors({ start: 'Bitte gib einen Titel für die Schätzung ein.' })
      return
    }
    if ([...trimmed].length > MAX_TITLE_LENGTH) {
      setErrors({ start: `Der Titel darf höchstens ${MAX_TITLE_LENGTH} Zeichen lang sein.` })
      return
    }
    // Eine laufende Abstimmung mit Stimmen wird nur nach ausdrücklicher Bestätigung ersetzt.
    if (round?.status === 'open' && round.votes.length > 0 && !confirmReplace) {
      setErrors({})
      setConfirmFor(round.roundId)
      return
    }
    await startWith(trimmed)
  }

  const onRestart = () => {
    if (round) void startWith(round.title)
  }

  const onVote = (card: CardValue) => {
    if (!round) return
    setPendingCard(card)
    void run(
      'vote',
      () => castVote(client, state.roomId, round.roundId, card),
      (fresh) =>
        fresh.round?.roundId === round.roundId &&
        fresh.round.votes.some((vote) => vote.userId === state.me.userId && vote.card === card),
    )
  }

  const onReveal = () => {
    if (!round) return
    void run(
      'reveal',
      () => revealRound(client, state.roomId, round.roundId),
      (fresh) => fresh.round?.roundId === round.roundId && fresh.round.status === 'revealed',
    )
  }

  const isOpen = round?.status === 'open'
  const startForm = (
    <form onSubmit={onStart} noValidate>
      <div className="field">
        <label htmlFor="round-title-input">Titel der Schätzung</label>
        <input
          id="round-title-input"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setConfirmFor(null)
          }}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="z. B. STORY-123 Login-Seite"
          readOnly={busy}
          aria-invalid={errors.start ? true : undefined}
          aria-describedby={errors.start ? 'start-error' : undefined}
        />
      </div>
      {errors.start && (
        <p id="start-error" className="error" role="alert">
          {errors.start}
        </p>
      )}
      {confirmReplace && (
        <div className="confirm" role="alert">
          <p>
            <strong>Laufende Abstimmung ersetzen?</strong> Die bisherigen Stimmen werden
            entfernt.
          </p>
          <div className="row">
            <button type="submit" disabled={offline} aria-disabled={busy || undefined}>
              {busyScope === 'start' ? 'Wird gespeichert …' : 'Ja, ersetzen'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmFor(null)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
      {!confirmReplace && (
        <button
          type="submit"
          className={isOpen ? 'secondary' : undefined}
          disabled={offline}
          aria-disabled={busy || undefined}
        >
          {busyScope === 'start'
          ? 'Wird gespeichert …'
          : !round
            ? 'Runde starten'
            : isOpen
              ? 'Neue Runde starten'
              : 'Nächste Story starten'}
        </button>
      )}
    </form>
  )

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
                {busyScope === 'vote' && pendingCard !== null
                  ? `Speichere deine Schätzung: ${cardDescription(pendingCard)} …`
                  : myVote === null
                    ? 'Du hast noch nicht abgestimmt.'
                    : `Deine Schätzung: ${cardDescription(myVote)} · gespeichert`}
              </p>
              {errors.vote && (
                <p className="error" role="alert">
                  {errors.vote}
                </p>
              )}
              <p className="hint">
                {myVote !== null && 'Du kannst sie bis zum Aufdecken ändern. '}
                Abgegebene Stimmen: <strong>{round.votes.length}</strong>
              </p>
              <button
                type="button"
                onClick={onReveal}
                disabled={offline}
                aria-disabled={busy || undefined}
              >
                {busyScope === 'reveal' ? 'Wird aufgedeckt …' : 'Karten aufdecken'}
              </button>
              {errors.reveal && (
                <p className="error" role="alert">
                  {errors.reveal}
                </p>
              )}
            </>
          ) : (
            <RevealedResults votes={round.votes} members={state.members} />
          )}
        </section>
      )}

      {isOpen ? (
        <details className="card room-details">
          <summary>Stattdessen eine andere Story schätzen</summary>
          {startForm}
        </details>
      ) : (
        <section className="card" aria-labelledby="start-title">
          <h2 id="start-title">{round ? 'Nächste Story' : 'Erste Runde starten'}</h2>
          {startForm}
          {round && (
            <p>
              <button
                type="button"
                className="secondary"
                onClick={onRestart}
                disabled={offline}
                aria-disabled={busy || undefined}
              >
                {busyScope === 'start' ? 'Wird gespeichert …' : 'Noch einmal schätzen'}
              </button>
            </p>
          )}
        </section>
      )}
    </>
  )
}
