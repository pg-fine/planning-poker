import { cardDescription, type CardValue } from '../domain/cards.ts'
import { cardOrder, describeAgreement, summarizeVotes } from '../domain/results.ts'
import type { Member, Vote } from '../supabase/roomState.ts'

type Props = { votes: Vote[]; members: Member[] }

function isSpecial(card: CardValue): boolean {
  return card === '?' || card === 'coffee'
}

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

/** Result after the reveal: who chose what, distribution and average of the number cards. */
export function RevealedResults({ votes, members }: Props) {
  if (votes.length === 0) {
    return <p>Nobody voted.</p>
  }

  const names = new Map(members.map((member) => [member.userId, member.displayName]))
  const rows = votes
    .map((vote) => ({
      userId: vote.userId,
      name: names.get(vote.userId) ?? vote.displayName ?? 'Unknown',
      card: vote.card,
    }))
    .sort((a, b) => cardOrder(a.card) - cardOrder(b.card) || a.name.localeCompare(b.name, 'en'))
  const summary = summarizeVotes(votes)

  const agreement = describeAgreement(summary)
  const maxCount = Math.max(...summary.distribution.map((entry) => entry.count))

  return (
    <div>
      {agreement && (
        <p className="success" role="status">
          {agreement}
        </p>
      )}

      <h3 className="results-heading">Distribution</h3>
      <ul className="distribution">
        {summary.distribution.map((entry) => (
          <li key={entry.card}>
            <span className="distribution__card">{cardDescription(entry.card)}</span>
            <span className="distribution__track" aria-hidden="true">
              <span
                className={`distribution__bar${isSpecial(entry.card) ? ' distribution__bar--special' : ''}`}
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </span>
            <span className="distribution__count">
              {entry.count} {entry.count === 1 ? 'vote' : 'votes'}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="results-heading">Who chose what?</h3>
      <ul className="result-list">
        {rows.map((row) => (
          <li key={row.userId}>
            <span className="result-list__name">{row.name}</span>
            <strong className="result-list__card">{cardDescription(row.card)}</strong>
          </li>
        ))}
      </ul>

      {summary.average !== null && (
        <p className="hint">
          Calculated average of the number cards: {numberFormat.format(summary.average)}. It is
          only a rough guide; the discussion about the differences matters more.
        </p>
      )}
    </div>
  )
}
