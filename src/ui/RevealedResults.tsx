import { cardLabel, type CardValue } from '../domain/cards.ts'
import { cardOrder, summarizeVotes } from '../domain/results.ts'
import type { Member, Vote } from '../supabase/roomState.ts'

type Props = { votes: Vote[]; members: Member[] }

function describeCard(card: CardValue): string {
  if (card === 'coffee') return '☕ Kaffeepause'
  if (card === '?') return '? Unklar'
  return cardLabel(card)
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

  return (
    <div>
      {summary.unanimous && (
        <p className="success" role="status">
          Einigkeit: Alle haben {describeCard(summary.distribution[0]!.card)} gewählt.
        </p>
      )}
      <ul className="result-list">
        {rows.map((row) => (
          <li key={row.userId}>
            <span className="result-list__name">{row.name}</span>
            <strong className="result-list__card">{describeCard(row.card)}</strong>
          </li>
        ))}
      </ul>
      <p className="hint">
        Verteilung:{' '}
        {summary.distribution
          .map((entry) => `${describeCard(entry.card)} × ${entry.count}`)
          .join(', ')}
        {summary.average !== null &&
          ` · Mittelwert der Zahlenkarten: ${numberFormat.format(summary.average)}`}
      </p>
    </div>
  )
}
