import { useCallback, useEffect, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'

export type RoomStateResult =
  | { status: 'loading' }
  | { status: 'ready'; state: RoomState }
  | { status: 'error'; error: unknown }

/**
 * Lädt den Raumzustand beim Öffnen und nimmt weitere Zustände entgegen (z. B. die Antworten
 * eigener Aktionen). Ein Zustand mit älterer Revision als der aktuelle wird verworfen, damit
 * eine verspätet eintreffende Antwort neuere Daten nicht überschreibt.
 * Live-Aktualisierung folgt mit Arbeitspaket 010.
 */
export function useRoomState(client: AppSupabaseClient, roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<RoomStateResult>({ status: 'loading' })

  const applyState = useCallback((next: RoomState) => {
    setResult((previous) =>
      previous.status === 'ready' && previous.state.revision > next.revision
        ? previous
        : { status: 'ready', state: next },
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    getRoomState(client, roomId).then(
      (state) => {
        if (!cancelled) applyState(state)
      },
      (error: unknown) => {
        if (!cancelled) setResult({ status: 'error', error })
      },
    )
    return () => {
      cancelled = true
    }
  }, [client, roomId, attempt, applyState])

  const reload = useCallback(() => {
    setResult({ status: 'loading' })
    setAttempt((value) => value + 1)
  }, [])

  return { result, reload, applyState }
}
