import { useCallback, useEffect, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'

export type RoomStateResult =
  | { status: 'loading' }
  | { status: 'ready'; state: RoomState }
  | { status: 'error'; error: unknown }

/** Lädt den Raumzustand beim Öffnen. Live-Aktualisierung folgt mit Arbeitspaket 010. */
export function useRoomState(client: AppSupabaseClient, roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<RoomStateResult>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getRoomState(client, roomId).then(
      (state) => {
        if (!cancelled) setResult({ status: 'ready', state })
      },
      (error: unknown) => {
        if (!cancelled) setResult({ status: 'error', error })
      },
    )
    return () => {
      cancelled = true
    }
  }, [client, roomId, attempt])

  const reload = useCallback(() => {
    setResult({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { result, reload }
}
