import { CARDS, type CardValue } from '../domain/cards.ts'

type Props = {
  selected: CardValue | null
  /** Action in progress: buttons keep focus, but clicks are ignored. */
  busy: boolean
  /** No connection: buttons are really disabled. */
  disabled: boolean
  onSelect: (card: CardValue) => void
}

/** Card selection. The selected card is identifiable by text and `aria-pressed`, not just by color. */
export function CardDeck({ selected, busy, disabled, onSelect }: Props) {
  return (
    <div className="deck" role="group" aria-label="Cards">
      {CARDS.map((card) => {
        const isSelected = card.value === selected
        return (
          <button
            key={card.value}
            type="button"
            className={isSelected ? 'card-button card-button--selected' : 'card-button'}
            aria-pressed={isSelected}
            aria-label={
              card.value === 'coffee'
                ? 'Coffee break'
                : card.value === '?'
                  ? 'Unclear (question mark)'
                  : `Card ${card.label}`
            }
            disabled={disabled}
            aria-disabled={busy || undefined}
            onClick={() => {
              if (!busy) onSelect(card.value)
            }}
          >
            <span className="card-button__label" aria-hidden="true">
              {card.label}
            </span>
            {isSelected && <span className="card-button__mark">selected</span>}
          </button>
        )
      })}
    </div>
  )
}
