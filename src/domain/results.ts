import { CARDS, type CardValue } from './cards.ts'

export type Distribution = { card: CardValue; count: number }

export type VoteSummary = {
  total: number
  /** Counted cards in the order of the card set. */
  distribution: Distribution[]
  /** Average over number cards only; `null` if there are none. Special cards do not count. */
  average: number | null
  /** At least two votes, all identical. */
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
 * Statement about whether the votes agree, or `null` if they differ (or there is only one vote).
 * Identical special cards are not agreement on the effort and are therefore named separately.
 */
export function describeAgreement(summary: VoteSummary): string | null {
  if (!summary.unanimous) return null
  const card = summary.distribution[0]!.card
  if (card === '?') return 'All votes cast: still unclear.'
  if (card === 'coffee') return 'All votes cast: coffee break.'
  return `All estimates cast are at ${card}.`
}

/** Sort value of a card in the card set (for a stable display order). */
export function cardOrder(card: CardValue): number {
  return CARDS.findIndex((entry) => entry.value === card)
}
