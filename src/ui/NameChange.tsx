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
  /** After a successful change: reload the room state. */
  onChanged: () => void
  offline: boolean
}

/**
 * Change the display name. Joining again with the same token is enough: the membership stays,
 * only the name is updated (see `join_room`).
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
      setMessage({ text: 'That is already your name.', error: false })
      return
    }
    if (offline) {
      setMessage({ text: 'No connection. Try again once it is back.', error: true })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      await joinRoom(client, token, check.name)
      saveDisplayName(check.name)
      touchRecentRoom(token, check.name)
      setName(check.name)
      setMessage({ text: 'Name changed.', error: false })
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
        {busy ? 'Saving …' : 'Change name'}
      </button>
      {message && (
        <p className={message.error ? 'error' : 'hint'} role={message.error ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}
    </form>
  )
}
