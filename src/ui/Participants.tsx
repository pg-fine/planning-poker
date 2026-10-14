import type { RoomState } from '../supabase/roomState.ts'

type Props = {
  state: RoomState
  /** Who is currently online; `null` if unknown (no live connection). */
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
 * Participants and their voting status, without revealing card values.
 *
 * "Participants" are the members who are currently online in the room (plus oneself). Former
 * members do not count towards "x of y voted". Anyone who voted and then went offline stays
 * visible with a check mark under "Not online". Being online does not say whether someone is
 * estimating or just watching.
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
          {member.userId === me.userId ? ' (you)' : ''}
        </span>
        {round && (isOpen || hasVoted) && (
          <span className="participant__status">
            {hasVoted ? '✓ voted' : showMissing && isOpen ? 'no vote yet' : ''}
          </span>
        )}
      </li>
    )
  }

  return (
    <aside className="card room-layout__side" aria-labelledby="members-title">
      <h2 id="members-title">
        {known ? 'Online' : 'Members'} ({online.length})
      </h2>
      {isOpen && known && (
        <p className="participants-summary" role="status">
          <strong>
            {votedOnline} of {online.length}
          </strong>{' '}
          voted
        </p>
      )}
      <ul className="participant-list">{online.map((member) => row(member, true))}</ul>
      {others.length > 0 && (
        <details className="participants-others">
          <summary>Not online ({others.length})</summary>
          <ul className="participant-list">{others.map((member) => row(member, false))}</ul>
        </details>
      )}
      <p className="hint">
        {known
          ? 'Online means everyone who currently has the room open, including those just watching. Card values stay hidden until the reveal.'
          : 'Everyone who has joined this room. Without a live connection it is unknown who is online.'}
      </p>
    </aside>
  )
}
