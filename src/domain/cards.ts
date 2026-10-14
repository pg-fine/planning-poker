/**
 * Erlaubte Karten. Gespeichert wird `value` (ASCII), angezeigt wird `label`.
 * Die Menge muss mit der Prüfregel `votes_card_valid` in der Datenbank übereinstimmen.
 */
export const CARDS = [
  { value: '0', label: '0', kind: 'number' },
  { value: '1', label: '1', kind: 'number' },
  { value: '2', label: '2', kind: 'number' },
  { value: '3', label: '3', kind: 'number' },
  { value: '5', label: '5', kind: 'number' },
  { value: '8', label: '8', kind: 'number' },
  { value: '13', label: '13', kind: 'number' },
  { value: '21', label: '21', kind: 'number' },
  { value: '?', label: '?', kind: 'special' },
  { value: 'coffee', label: '☕', kind: 'special' },
] as const

export type Card = (typeof CARDS)[number]
export type CardValue = Card['value']

const VALUES: readonly string[] = CARDS.map((card) => card.value)

export function isCardValue(value: unknown): value is CardValue {
  return typeof value === 'string' && VALUES.includes(value)
}

export function cardLabel(value: CardValue): string {
  return CARDS.find((card) => card.value === value)?.label ?? value
}

/** Ausgeschriebene Bezeichnung für Texte, z. B. „☕ Kaffeepause“. */
export function cardDescription(value: CardValue): string {
  if (value === 'coffee') return '☕ Kaffeepause'
  if (value === '?') return '? Unklar'
  return cardLabel(value)
}
