import { useState, type FormEvent } from 'react'
import { checkDisplayName } from '../domain/validation.ts'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { createRoom, describeRoomError } from '../supabase/rooms.ts'
import { NameField } from './NameField.tsx'
import { navigate, roomPath } from './routing.ts'
import { loadDisplayName, rememberRoom, saveDisplayName } from './storage.ts'

export function HomePage({ client }: { client: AppSupabaseClient }) {
  const [name, setName] = useState(loadDisplayName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const check = checkDisplayName(name)
    if (!check.ok) {
      setError(check.message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { roomId, inviteToken } = await createRoom(client, check.name)
      saveDisplayName(check.name)
      rememberRoom(inviteToken, roomId)
      navigate(roomPath(inviteToken))
    } catch (caught) {
      setError(describeRoomError(caught))
      setBusy(false)
    }
  }

  return (
    <section className="card" aria-labelledby="home-title">
      <h2 id="home-title">Neuen Raum erstellen</h2>
      <p>
        Du erhältst einen Link, den du im Teams-Chat teilen kannst. Wer ihn öffnet, gibt
        einen Namen ein und schätzt mit. Der Link bleibt dauerhaft gültig.
      </p>
      <form onSubmit={onSubmit} noValidate>
        <NameField value={name} onChange={setName} disabled={busy} />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? 'Raum wird erstellt …' : 'Raum erstellen'}
        </button>
      </form>
      <p className="hint">
        Hast du einen Einladungslink? Öffne ihn einfach in diesem Browser.
      </p>
    </section>
  )
}
