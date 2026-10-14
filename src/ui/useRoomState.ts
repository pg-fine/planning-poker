import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'
import { RoomError } from '../supabase/rooms.ts'

export type RoomStateResult =
  | { status: 'loading' }
  | { status: 'ready'; state: RoomState }
  | { status: 'error'; error: unknown }

/** Zustand des Echtzeit-Kanals dieses Raums. */
export type Connection = 'connecting' | 'live' | 'offline'

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Meldung des Browsers, ob eine Netzwerkverbindung besteht (kann „online“ fälschlich melden). */
function useBrowserOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine)
}

const POLL_INTERVAL_MS = 5000
/** Mit Live-Kanal wird nur jeden 6. Takt (also alle 30 Sekunden) abgeglichen. */
const LIVE_RECONCILE_TICKS = 6

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
  const [channelState, setChannelState] = useState<Connection>('connecting')
  // Wer gerade im Raum online ist (Presence); `null`, solange unbekannt (kein Live-Kanal).
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string> | null>(null)
  const browserOnline = useBrowserOnline()
  // Ohne Netzwerk ist die Verbindung sofort „offline“, auch wenn der Kanal es noch nicht bemerkt hat.
  const connection: Connection = browserOnline ? channelState : 'offline'

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

    // Nach Rückkehr des Netzwerks oder in den Tab (Ruhezustand, Tab-Wechsel) kann sich der
    // Raum geändert haben, ohne dass ein Ereignis ankam: Stand abgleichen.
    const onOnline = () => void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)

    let channelLive = false
    // Sicherheitsnetz: Ohne Live-Kanal (z. B. WebSockets im Firmennetz blockiert) wird alle 5 Sekunden
    // nachgefragt. Auch mit Live-Kanal gleicht ein seltener Abgleich Ereignisse aus, die verloren
    // gehen können (z. B. direkt nach dem Verbinden, bevor die Datenbank-Anbindung bereit ist).
    let ticks = 0
    const poll = window.setInterval(() => {
      ticks += 1
      const due = channelLive ? ticks % LIVE_RECONCILE_TICKS === 0 : true
      if (due && document.visibilityState === 'visible' && navigator.onLine) {
        void load()
      }
    }, POLL_INTERVAL_MS)

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
          channelLive = true
          setChannelState('live')
          // Zwischen Erstladen und Abonnement (bzw. während einer Unterbrechung) kann sich
          // etwas geändert haben: nach jedem (erneuten) Verbinden den Stand abgleichen.
          void load()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          channelLive = false
          setChannelState('offline')
        }
      })

    // Anwesenheit: eigener Kanal mit gemeinsamem Namen je Raum (der Datenkanal oben hat einen
    // eindeutigen Namen je Browser-Tab und taugt dafür nicht). Übertragen wird nur die Nutzer-ID;
    // Namen kommen aus der Mitgliederliste, die nur Mitglieder lesen dürfen.
    const presence = client.channel(`presence:${roomId}`)
    presence
      .on('presence', { event: 'sync' }, () => {
        if (cancelled) return
        const ids = new Set<string>()
        for (const entries of Object.values(presence.presenceState<{ userId?: string }>())) {
          for (const entry of entries) {
            if (typeof entry.userId === 'string') ids.add(entry.userId)
          }
        }
        setOnlineIds(ids)
      })
      .subscribe((status) => {
        if (cancelled) return
        if (status === 'SUBSCRIBED') {
          void client.auth.getSession().then(({ data }) => {
            const userId = data.session?.user.id
            if (userId && !cancelled) void presence.track({ userId })
          })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setOnlineIds(null)
        }
      })

    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(poll)
      void client.removeChannel(channel)
      void client.removeChannel(presence)
    }
  }, [client, roomId, attempt, applyState])

  const reload = useCallback(() => {
    setResult({ status: 'loading' })
    setChannelState('connecting')
    setOnlineIds(null)
    setAttempt((value) => value + 1)
  }, [])

  return { result, reload, applyState, connection, browserOnline, onlineIds }
}
