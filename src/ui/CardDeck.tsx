import { CARDS, type CardValue } from '../domain/cards.ts'

type Props = {
  selected: CardValue | null
  /** Aktion läuft: Knöpfe behalten den Fokus, Klicks werden aber ignoriert. */
  busy: boolean
  /** Keine Verbindung: Knöpfe sind wirklich gesperrt. */
  disabled: boolean
  onSelect: (card: CardValue) => void
}

/** Kartenauswahl. Die gewählte Karte ist per Text und `aria-pressed` erkennbar, nicht nur per Farbe. */
export function CardDeck({ selected, busy, disabled, onSelect }: Props) {
  return (
    <div className="deck" role="group" aria-label="Karten">
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
                ? 'Kaffeepause'
                : card.value === '?'
                  ? 'Unklar (Fragezeichen)'
                  : `Karte ${card.label}`
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
            {isSelected && <span className="card-button__mark">gewählt</span>}
          </button>
        )
      })}
    </div>
  )
}
