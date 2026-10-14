import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import type { AppSupabaseClient } from '../supabase/client.ts'
import { getRoomState, type RoomState } from '../supabase/roomState.ts'
import { RoomError } from '../supabase/rooms.ts'

export type RoomStateResult =
  | { status: 'loading' }
  | { status: 'ready'; state: RoomState }
  | { status: 'error'; error: unknown }

/** State of this room's realtime channel. */
export type Connection = 'connecting' | 'live' | 'offline'

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** The browser's report of whether a network connection exists (may wrongly report "online"). */
function useBrowserOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine)
}

const POLL_INTERVAL_MS = 5000
/** With a live channel, only every 6th tick (i.e. every 30 seconds) is reconciled. */
const LIVE_RECONCILE_TICKS = 6

function isNotMember(error: unknown): boolean {
  return error instanceof RoomError && error.code === 'not_member'
}

/**
 * Loads the room state and keeps it up to date live.
 *
 * The database is authoritative: realtime events and own actions only trigger loading or
 * adopting the snapshot. A state with an older revision than the current one is discarded so
 * that late responses do not overwrite newer data.
 */
export function useRoomState(client: AppSupabaseClient, roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<RoomStateResult>({ status: 'loading' })
  const [channelState, setChannelState] = useState<Connection>('connecting')
  // Who is currently online in the room (presence); `null` while unknown (no live channel).
  const [onlineIds, setOnlineIds] = useState<ReadonlySet<string> | null>(null)
  const browserOnline = useBrowserOnline()
  // Without a network the connection is immediately "offline", even if the channel has not noticed yet.
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

    // Loads the snapshot. Overlapping requests are merged into one reload.
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
            // An already displayed state stays on load errors; only the loss of membership
            // and a failed initial load are reported.
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

    // After the network or the tab returns (sleep, tab switch) the room may have changed
    // without an event arriving: reconcile the state.
    const onOnline = () => void load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)

    let channelLive = false
    // Safety net: without a live channel (e.g. WebSockets blocked in a corporate network) the state
    // is polled every 5 seconds. Even with a live channel an infrequent reconciliation makes up for
    // events that can get lost (e.g. right after connecting, before the database binding is ready).
    let ticks = 0
    const poll = window.setInterval(() => {
      ticks += 1
      const due = channelLive ? ticks % LIVE_RECONCILE_TICKS === 0 : true
      if (due && document.visibilityState === 'visible' && navigator.onLine) {
        void load()
      }
    }, POLL_INTERVAL_MS)

    // Unique channel name per effect run so that an old channel that is still closing (e.g. in
    // React development mode) is not reused.
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
          // Something may have changed between the initial load and the subscription (or during an
          // interruption): reconcile the state after every (re)connect.
          void load()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          channelLive = false
          setChannelState('offline')
        }
      })

    // Presence: a separate channel with a shared name per room (the data channel above has a
    // unique name per browser tab and is unsuitable for this). Only the user ID is transmitted;
    // names come from the member list, which only members may read.
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
