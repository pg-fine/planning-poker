import { useCallback, useEffect, useState } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'
import { RoomError } from '../supabase/rooms.ts'

export type RoomStateResult =
  | { status: 'loading' }
  | { status: 'ready'; state: RoomState }
  | { status: 'error'; error: unknown }

/** Zustand des Echtzeit-Kanals dieses Raums. */
export type Connection = 'connecting' | 'live' | 'offline'

function isNotMember(error: unknown): boolean {
  return error instanceof RoomError && error.code === 'not_member'
}

/**
 * Lädt den Raumzustand und hält ihn live aktuell.
 *
 * Die Datenbank ist maßgeblich: Echtzeit-Ereignisse und eigene Aktionen lösen nur aus, dass
 * der Snapshot geladen oder übernommen wird. Ein Zustand mit älterer Revision als der aktuelle
 * wird verworfen, damit verspätete Antworten neuere Daten nicht überschreiben.
 */
export function useRoomState(client: AppSupabaseClient, roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<RoomStateResult>({ status: 'loading' })
  const [connection, setConnection] = useState<Connection>('connecting')

  const applyState = useCallback((next: RoomState) => {
    setResult((previous) =>
      previous.status === 'ready' && previous.state.revision > next.revision
        ? previous
        : { status: 'ready', state: next },
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    let loading = false
    let loadAgain = false

    // Lädt den Snapshot. Überlappende Anforderungen werden zu einem Nachladen zusammengefasst.
    const load = async () => {
      if (loading) {
        loadAgain = true
        return
      }
      loading = true
      try {
        do {
          loadAgain = false
          try {
            const state = await getRoomState(client, roomId)
            if (!cancelled) applyState(state)
          } catch (error) {
            if (cancelled) break
            // Ein bereits angezeigter Zustand bleibt bei Ladefehlern stehen; nur der Verlust
            // der Mitgliedschaft und ein fehlgeschlagenes Erstladen werden gemeldet.
            setResult((previous) =>
              previous.status === 'ready' && !isNotMember(error)
                ? previous
                : { status: 'error', error },
            )
          }
        } while (loadAgain && !cancelled)
      } finally {
        loading = false
      }
    }

    void load()

    // Eindeutiger Kanalname je Effektlauf, damit ein noch schließender alter Kanal (z. B. im
    // React-Entwicklungsmodus) nicht wiederverwendet wird.
    const channel = client
      .channel(`room:${roomId}:${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => {
          void load()
        },
      )
      .subscribe((status) => {
        if (cancelled) return
        if (status === 'SUBSCRIBED') {
          setConnection('live')
          // Zwischen Erstladen und Abonnement (bzw. während einer Unterbrechung) kann sich
          // etwas geändert haben: nach jedem (erneuten) Verbinden den Stand abgleichen.
          void load()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnection('offline')
        }
      })

    return () => {
      cancelled = true
      void client.removeChannel(channel)
    }
  }, [client, roomId, attempt, applyState])

  const reload = useCallback(() => {
    setResult({ status: 'loading' })
    setConnection('connecting')
    setAttempt((value) => value + 1)
  }, [])

  return { result, reload, applyState, connection }
}
