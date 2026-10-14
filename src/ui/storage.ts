/**
 * Merkt sich im Browser den zuletzt verwendeten Namen und die Räume, denen dieser Browser
 * beigetreten ist (Einladungstoken → Raum-ID). Beides sind keine Geheimnisse über das hinaus,
 * was in der Adresszeile steht. Der Speicher kann fehlen oder blockiert sein (Privatmodus);
 * dann funktioniert die App weiter, merkt sich aber nichts.
 */
const NAME_KEY = 'planning-poker:display-name'
const ROOMS_KEY = 'planning-poker:rooms'
const RECENT_KEY = 'planning-poker:recent-rooms'
const MAX_RECENT = 10

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Speicher voll oder gesperrt: ignorieren.
  }
}

export function loadDisplayName(): string {
  return read(NAME_KEY) ?? ''
}

export function saveDisplayName(name: string): void {
  write(NAME_KEY, name)
}

function loadRooms(): Record<string, string> {
  const raw = read(ROOMS_KEY)
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {}
    }
    const rooms: Record<string, string> = {}
    for (const [token, roomId] of Object.entries(parsed)) {
      if (typeof roomId === 'string') rooms[token] = roomId
    }
    return rooms
  } catch {
    return {}
  }
}

export function loadKnownRoom(token: string): string | null {
  return loadRooms()[token] ?? null
}

export function rememberRoom(token: string, roomId: string, displayName?: string): void {
  write(ROOMS_KEY, JSON.stringify({ ...loadRooms(), [token]: roomId }))
  touchRecentRoom(token, displayName)
}

export function forgetRoom(token: string): void {
  const rooms = loadRooms()
  delete rooms[token]
  write(ROOMS_KEY, JSON.stringify(rooms))
}

/** Ein zuletzt verwendeter Raum: nur Einladungstoken, letzter Besuch und der eigene Name dort. */
export type RecentRoom = {
  token: string
  lastUsed: number
  displayName: string
  /** Raumname, falls der Raum einen hat; sonst leer. */
  roomName: string
}

export function loadRecentRooms(): RecentRoom[] {
  const raw = read(RECENT_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const rooms: RecentRoom[] = []
    for (const entry of parsed) {
      if (
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentRoom).token === 'string' &&
        typeof (entry as RecentRoom).lastUsed === 'number'
      ) {
        const { token, lastUsed, displayName, roomName } = entry as RecentRoom
        rooms.push({
          token,
          lastUsed,
          displayName: typeof displayName === 'string' ? displayName : '',
          roomName: typeof roomName === 'string' ? roomName : '',
        })
      }
    }
    return rooms.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, MAX_RECENT)
  } catch {
    return []
  }
}

/**
 * Markiert den Raum als gerade verwendet. Nicht angegebene Werte (`undefined`) bleiben erhalten;
 * `roomName: null` löscht einen gemerkten Raumnamen.
 */
export function touchRecentRoom(
  token: string,
  displayName?: string,
  roomName?: string | null,
): void {
  const rooms = loadRecentRooms()
  const previous = rooms.find((room) => room.token === token)
  const entry: RecentRoom = {
    token,
    lastUsed: Date.now(),
    displayName: displayName ?? previous?.displayName ?? '',
    roomName: roomName === undefined ? (previous?.roomName ?? '') : (roomName ?? ''),
  }
  write(
    RECENT_KEY,
    JSON.stringify([entry, ...rooms.filter((room) => room.token !== token)].slice(0, MAX_RECENT)),
  )
}

export function removeRecentRoom(token: string): void {
  write(RECENT_KEY, JSON.stringify(loadRecentRooms().filter((room) => room.token !== token)))
}
