import { cardLabel, type CardValue } from '../domain/cards.ts'
import { cardOrder, describeAgreement, summarizeVotes } from '../domain/results.ts'
import type { Member, Vote } from '../supabase/roomState.ts'

type Props = { votes: Vote[]; members: Member[] }

function describeCard(card: CardValue): string {
  if (card === 'coffee') return '☕ Kaffeepause'
  if (card === '?') return '? Unklar'
  return cardLabel(card)
}

function isSpecial(card: CardValue): boolean {
  return card === '?' || card === 'coffee'
}

const numberFormat = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })

/** Ergebnis nach dem Aufdecken: wer hat was gewählt, Verteilung und Mittelwert der Zahlenkarten. */
export function RevealedResults({ votes, members }: Props) {
  if (votes.length === 0) {
    return <p>Niemand hat abgestimmt.</p>
  }

  const names = new Map(members.map((member) => [member.userId, member.displayName]))
  const rows = votes
    .map((vote) => ({
      userId: vote.userId,
      name: names.get(vote.userId) ?? 'Unbekannt',
      card: vote.card,
    }))
    .sort((a, b) => cardOrder(a.card) - cardOrder(b.card) || a.name.localeCompare(b.name, 'de'))
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

      <h3 className="results-heading">Verteilung</h3>
      <ul className="distribution">
        {summary.distribution.map((entry) => (
          <li key={entry.card}>
            <span className="distribution__card">{describeCard(entry.card)}</span>
            <span className="distribution__track" aria-hidden="true">
              <span
                className={`distribution__bar${isSpecial(entry.card) ? ' distribution__bar--special' : ''}`}
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </span>
            <span className="distribution__count">
              {entry.count} {entry.count === 1 ? 'Stimme' : 'Stimmen'}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="results-heading">Wer hat was gewählt?</h3>
      <ul className="result-list">
        {rows.map((row) => (
          <li key={row.userId}>
            <span className="result-list__name">{row.name}</span>
            <strong className="result-list__card">{describeCard(row.card)}</strong>
          </li>
        ))}
      </ul>

      {summary.average !== null && (
        <p className="hint">
          Rechnerischer Mittelwert der Zahlenkarten: {numberFormat.format(summary.average)}. Er ist
          nur ein Anhaltspunkt; wichtiger ist die Diskussion über die Unterschiede.
        </p>
      )}
    </div>
  )
}
