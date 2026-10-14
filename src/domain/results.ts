import { CARDS, type CardValue } from './cards.ts'

export type Distribution = { card: CardValue; count: number }

export type VoteSummary = {
  total: number
  /** Gezählte Karten in der Reihenfolge des Kartensatzes. */
  distribution: Distribution[]
  /** Mittelwert nur über Zahlenkarten; `null`, wenn es keine gibt. Sonderkarten zählen nicht. */
  average: number | null
  /** Mindestens zwei Stimmen und alle gleich. */
  unanimous: boolean
}

export function summarizeVotes(votes: readonly { card: CardValue }[]): VoteSummary {
  const distribution: Distribution[] = []
  let numberSum = 0
  let numberCount = 0

  for (const card of CARDS) {
    const count = votes.filter((vote) => vote.card === card.value).length
    if (count === 0) continue
    distribution.push({ card: card.value, count })
    if (card.kind === 'number') {
      numberSum += Number(card.value) * count
      numberCount += count
    }
  }

  return {
    total: votes.length,
    distribution,
    average: numberCount > 0 ? numberSum / numberCount : null,
    unanimous: votes.length >= 2 && distribution.length === 1,
  }
}

/**
 * Aussage zur Übereinstimmung der Stimmen oder `null`, wenn sie nicht einheitlich sind (oder es
 * nur eine Stimme gibt). Gleiche Sonderkarten sind keine Einigkeit über den Aufwand und werden
 * deshalb gesondert benannt.
 */
export function describeAgreement(summary: VoteSummary): string | null {
  if (!summary.unanimous) return null
  const card = summary.distribution[0]!.card
  if (card === '?') return 'Alle abgegebenen Stimmen: noch unklar.'
  if (card === 'coffee') return 'Alle abgegebenen Stimmen: Kaffeepause.'
  return `Alle abgegebenen Schätzungen liegen bei ${card}.`
}

/** Sortierwert einer Karte im Kartensatz (für stabile Anzeigereihenfolge). */
export function cardOrder(card: CardValue): number {
  return CARDS.findIndex((entry) => entry.value === card)
}
