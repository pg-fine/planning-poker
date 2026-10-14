import type { RoomState } from '../supabase/roomState.ts'

type Props = {
  state: RoomState
  /** Wer gerade online ist; `null`, wenn das nicht bekannt ist (keine Live-Verbindung). */
  onlineIds: ReadonlySet<string> | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : [parts[0] ?? '?']
  return letters
    .map((part) => [...part][0] ?? '')
    .join('')
    .toUpperCase()
}

/**
 * Teilnehmende und ihr Stimmstatus, ohne Kartenwerte zu verraten.
 *
 * „Teilnehmende“ sind die Mitglieder, die gerade im Raum online sind (plus man selbst). Frühere
 * Mitglieder fließen nicht in „x von y abgestimmt“ ein. Wer offline schon abgestimmt hat, bleibt
 * unter „Nicht online“ mit Haken sichtbar. Online-Sein sagt nicht, ob jemand mitschätzt oder nur zusieht.
 */
export function Participants({ state, onlineIds }: Props) {
  const { members, me, round } = state
  const voted = new Set(round?.votes.map((vote) => vote.userId))
  const isOnline = (userId: string) => userId === me.userId || (onlineIds?.has(userId) ?? false)

  const known = onlineIds !== null
  const online = known ? members.filter((member) => isOnline(member.userId)) : members
  const others = known ? members.filter((member) => !isOnline(member.userId)) : []
  const isOpen = round?.status === 'open'
  const votedOnline = online.filter((member) => voted.has(member.userId)).length

  const row = (member: (typeof members)[number], showMissing: boolean) => {
    const hasVoted = voted.has(member.userId)
    return (
      <li key={member.userId} className="participant">
        <span className="participant__avatar" aria-hidden="true">
          {initials(member.displayName)}
        </span>
        <span className="participant__name">
          {member.displayName}
          {member.userId === me.userId ? ' (du)' : ''}
        </span>
        {round && (isOpen || hasVoted) && (
          <span className="participant__status">
            {hasVoted ? '✓ abgestimmt' : showMissing && isOpen ? 'noch keine Stimme' : ''}
          </span>
        )}
      </li>
    )
  }

  return (
    <aside className="card room-layout__side" aria-labelledby="members-title">
      <h2 id="members-title">
        {known ? 'Online' : 'Mitglieder'} ({online.length})
      </h2>
      {isOpen && known && (
        <p className="participants-summary" role="status">
          <strong>
            {votedOnline} von {online.length}
          </strong>{' '}
          abgestimmt
        </p>
      )}
      <ul className="participant-list">{online.map((member) => row(member, true))}</ul>
      {others.length > 0 && (
        <details className="participants-others">
          <summary>Nicht online ({others.length})</summary>
          <ul className="participant-list">{others.map((member) => row(member, false))}</ul>
        </details>
      )}
      <p className="hint">
        {known
          ? 'Online sind alle, die den Raum gerade geöffnet haben, auch wer nur zusieht. Die Kartenwerte bleiben bis zum Aufdecken verborgen.'
          : 'Alle, die diesem Raum beigetreten sind. Ohne Live-Verbindung ist nicht bekannt, wer gerade online ist.'}
      </p>
    </aside>
  )
}
