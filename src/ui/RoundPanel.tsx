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
  /** No connection: actions are disabled until it is back. */
  offline: boolean
}

/** No response or the connection dropped: the action may have arrived. */
function isUnclear(error: unknown): boolean {
  return (
    !(error instanceof RoomError) ||
    error.code === 'network' ||
    error.code === 'unknown'
  )
}

/** Errors after which the view is reloaded because the round has changed in the meantime. */
function isStaleRound(error: unknown): boolean {
  return (
    error instanceof RoomError &&
    (error.code === 'round_conflict' || error.code === 'round_not_open')
  )
}

/** Area in which an action runs or its feedback appears. */
type Scope = 'vote' | 'reveal' | 'start'

export function RoundPanel({ client, state, onState, offline }: Props) {
  const { round } = state
  const [busyScope, setBusyScope] = useState<Scope | null>(null)
  const busy = busyScope !== null
  const [errors, setErrors] = useState<Partial<Record<Scope, string>>>({})
  const [pendingCard, setPendingCard] = useState<CardValue | null>(null)
  const [title, setTitle] = useState('')
  // The confirmation only applies to the round for which it was asked.
  const [confirmFor, setConfirmFor] = useState<string | null>(null)
  const confirmReplace = round !== null && confirmFor === round.roundId
  const heading = useRef<HTMLHeadingElement>(null)

  // On reveal the focused button disappears. If focus is then lost, we move it to the result so
  // keyboard and screen reader users can continue there. Anyone typing in a field keeps focus.
  const revealed = round?.status === 'revealed'
  useEffect(() => {
    if (revealed && (!document.activeElement || document.activeElement === document.body)) {
      heading.current?.focus({ preventScroll: true })
    }
  }, [revealed, round?.roundId])

  const myVote = round?.votes.find((vote) => vote.userId === state.me.userId)?.card ?? null

  /**
   * Runs an action and only adopts its confirmed state.
   *
   * On an unclear response (connection dropped) the action is never repeated blindly. Instead
   * the state is loaded; `wasApplied` decides whether the action is already visible there.
   */
  const run = async (
    scope: Scope,
    action: () => Promise<RoomState>,
    wasApplied?: (fresh: RoomState) => boolean,
  ): Promise<boolean> => {
    if (busy) return false
    if (offline) {
      setErrors({ [scope]: 'No connection. As soon as it is back, you can continue.' })
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
            'The connection was interrupted. The current state has been loaded; your action did not arrive. Try again.'
        } catch {
          message =
            'No connection to Supabase. Your action may not have arrived. Check the state as soon as the connection is back.'
        }
      } else if (isStaleRound(caught)) {
        try {
          onState(await getRoomState(client, state.roomId))
          message += ' The view has been updated.'
        } catch {
          // Refresh failed: the original message is enough.
        }
      }
      setErrors({ [scope]: message })
      return false
    } finally {
      setBusyScope(null)
    }
  }

  /** Starts a new round with the title; on success the confirmation is done. */
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
      setErrors({ start: 'Please enter a title for the estimate.' })
      return
    }
    if ([...trimmed].length > MAX_TITLE_LENGTH) {
      setErrors({ start: `The title may be at most ${MAX_TITLE_LENGTH} characters long.` })
      return
    }
    // A running vote with votes is only replaced after explicit confirmation.
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
        <label htmlFor="round-title-input">Title of the estimate</label>
        <input
          id="round-title-input"
          type="text"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setConfirmFor(null)
          }}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="e.g. STORY-123 Login page"
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
            <strong>Replace the running vote?</strong> The votes cast so far will be
            removed.
          </p>
          <div className="row">
            <button type="submit" disabled={offline} aria-disabled={busy || undefined}>
              {busyScope === 'start' ? 'Saving …' : 'Yes, replace'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmFor(null)}
            >
              Cancel
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
          ? 'Saving …'
          : !round
            ? 'Start round'
            : isOpen
              ? 'Start new round'
              : 'Start next story'}
        </button>
      )}
    </form>
  )

  return (
    <>
      {round && (
        <section className="card" aria-labelledby="round-title">
          <p className="hint">{round.status === 'open' ? 'Voting in progress' : 'Revealed'}</p>
          <h2 id="round-title" className="round-title" ref={heading} tabIndex={-1}>
            {round.title}
          </h2>

          {round.status === 'open' ? (
            <>
              <CardDeck selected={myVote} busy={busy} disabled={offline} onSelect={onVote} />
              <p role="status">
                {busyScope === 'vote' && pendingCard !== null
                  ? `Saving your estimate: ${cardDescription(pendingCard)} …`
                  : myVote === null
                    ? 'You have not voted yet.'
                    : `Your estimate: ${cardDescription(myVote)} · saved`}
              </p>
              {errors.vote && (
                <p className="error" role="alert">
                  {errors.vote}
                </p>
              )}
              <p className="hint">
                {myVote !== null && 'You can change it until the reveal. '}
                Votes cast: <strong>{round.votes.length}</strong>
              </p>
              <button
                type="button"
                onClick={onReveal}
                disabled={offline}
                aria-disabled={busy || undefined}
              >
                {busyScope === 'reveal' ? 'Revealing …' : 'Reveal cards'}
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
          <summary>Estimate a different story instead</summary>
          {startForm}
        </details>
      ) : (
        <section className="card" aria-labelledby="start-title">
          <h2 id="start-title">{round ? 'Next story' : 'Start the first round'}</h2>
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
                {busyScope === 'start' ? 'Saving …' : 'Estimate again'}
              </button>
            </p>
          )}
        </section>
      )}
    </>
  )
}
