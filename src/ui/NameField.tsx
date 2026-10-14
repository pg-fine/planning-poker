import { useId } from 'react'
import { MAX_NAME_LENGTH } from '../domain/validation.ts'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Eingabefeld für den Anzeigenamen (beschriftet, mit Längenbegrenzung). */
export function NameField({ value, onChange, disabled }: Props) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>Dein Name</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="nickname"
        disabled={disabled}
        required
      />
    </div>
  )
}
