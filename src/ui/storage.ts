/**
 * Merkt sich im Browser den zuletzt verwendeten Namen und die Räume, denen dieser Browser
 * beigetreten ist (Einladungstoken → Raum-ID). Beides sind keine Geheimnisse über das hinaus,
 * was in der Adresszeile steht. Der Speicher kann fehlen oder blockiert sein (Privatmodus);
 * dann funktioniert die App weiter, merkt sich aber nichts.
 */
const NAME_KEY = 'planning-poker:display-name'
const ROOMS_KEY = 'planning-poker:rooms'

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

export function rememberRoom(token: string, roomId: string): void {
  write(ROOMS_KEY, JSON.stringify({ ...loadRooms(), [token]: roomId }))
}

export function forgetRoom(token: string): void {
  const rooms = loadRooms()
  delete rooms[token]
  write(ROOMS_KEY, JSON.stringify(rooms))
}
