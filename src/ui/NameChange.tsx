import { useState, type FormEvent } from 'react'
import { checkDisplayName } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { describeRoomError, joinRoom } from '../supabase/rooms.ts'
import { NameField } from './NameField.tsx'
import { saveDisplayName, touchRecentRoom } from './storage.ts'

type Props = {
  client: AppSupabaseClient
  token: string
  currentName: string
  /** Nach erfolgreicher Änderung: Raumstand neu laden. */
  onChanged: () => void
  offline: boolean
}

/**
 * Anzeigenamen ändern. Dafür genügt erneutes Beitreten mit demselben Token: Die Mitgliedschaft
 * bleibt bestehen, nur der Name wird aktualisiert (siehe `join_room`).
 */
export function NameChange({ client, token, currentName, onChanged, offline }: Props) {
  const [name, setName] = useState(currentName)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const check = checkDisplayName(name)
    if (!check.ok) {
      setMessage({ text: check.message, error: true })
      return
    }
    if (check.name === currentName) {
      setMessage({ text: 'Das ist bereits dein Name.', error: false })
      return
    }
    if (offline) {
      setMessage({ text: 'Keine Verbindung. Versuche es erneut, sobald sie besteht.', error: true })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await joinRoom(client, token, check.name)
      saveDisplayName(check.name)
      touchRecentRoom(token, check.name)
      setName(check.name)
      setMessage({ text: 'Name geändert.', error: false })
      onChanged()
    } catch (caught) {
      setMessage({ text: describeRoomError(caught), error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <NameField value={name} onChange={setName} readOnly={busy} />
      <button type="submit" className="secondary" aria-disabled={busy || undefined}>
        {busy ? 'Wird gespeichert …' : 'Name ändern'}
      </button>
      {message && (
        <p className={message.error ? 'error' : 'hint'} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
