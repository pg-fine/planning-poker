import { useId } from 'react'
import { MAX_NAME_LENGTH } from '../domain/validation.ts'

type Props = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

/** Eingabefeld für den Anzeigenamen (beschriftet, mit Längenbegrenzung). */
export function NameField({ value, onChange, readOnly }: Props) {
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
        readOnly={readOnly}
        required
      />
    </div>
  )
}
