import type { PostgrestError } from '@supabase/supabase-js'
import type { AppSupabaseClient } from './client.ts'

/**
 * Fachliche Fehlercodes der Datenbankfunktionen (siehe docs/daten-und-aktionsvertrag.md).
 * `network` und `unknown` kommen aus dem Frontend, alle anderen aus der Datenbank.
 */
export const ROOM_ERROR_CODES = [
  'not_authenticated',
  'invalid_token',
  'not_member',
  'invalid_name',
  'invalid_title',
  'invalid_room_name',
  'invalid_card',
  'no_round',
  'round_conflict',
  'round_not_open',
] as const

export type RoomErrorCode = (typeof ROOM_ERROR_CODES)[number] | 'network' | 'unknown'

export class RoomError extends Error {
  readonly code: RoomErrorCode

  constructor(code: RoomErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RoomError'
    this.code = code
  }
}

const MESSAGES: Record<RoomErrorCode, string> = {
  not_authenticated: 'Du bist nicht angemeldet. Lade die Seite neu.',
  invalid_token: 'Dieser Einladungslink ist ungültig.',
  not_member: 'Du bist kein Mitglied dieses Raums.',
  invalid_name: 'Der Name muss 1 bis 40 Zeichen lang sein.',
  invalid_title: 'Der Titel muss 1 bis 120 Zeichen lang sein.',
  invalid_room_name: 'Der Raumname darf höchstens 60 Zeichen lang sein.',
  invalid_card: 'Diese Karte ist nicht erlaubt.',
  no_round: 'Es gibt noch keine Runde.',
  round_conflict: 'Die Runde wurde inzwischen geändert.',
  round_not_open: 'Die Runde ist bereits aufgedeckt.',
  network:
    'Supabase ist nicht erreichbar. Prüfe deine Internetverbindung. Mögliche weitere Ursachen: Ein kostenloses Supabase-Projekt wird nach längerer Inaktivität pausiert und muss im Dashboard reaktiviert werden, oder das Netzwerk blockiert die Verbindung.',
  unknown: 'Unerwarteter Fehler. Versuche es erneut.',
}

/** Deutsche Meldung für die Oberfläche. */
export function describeRoomError(error: unknown): string {
  return MESSAGES[error instanceof RoomError ? error.code : 'unknown']
}

/** Übersetzt einen Fehler der Datenbankfunktion in einen RoomError. */
export function toRoomError(error: PostgrestError): RoomError {
  const known = (ROOM_ERROR_CODES as readonly string[]).includes(error.message)
  if (known) {
    return new RoomError(error.message as RoomErrorCode, error.message, {
      cause: error,
    })
  }
  // Verbindungsfehler haben keinen Datenbankcode (fetch schlägt vor der Antwort fehl).
  if (!error.code && /fetch|network|load failed/i.test(error.message)) {
    return new RoomError('network', error.message, { cause: error })
  }
  return new RoomError('unknown', error.message, { cause: error })
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new RoomError('unknown', `Antwort ohne ${field}.`)
  }
  return value
}

function readObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new RoomError('unknown', 'Unerwartete Antwort der Datenbank.')
  }
  return value as Record<string, unknown>
}

export type CreatedRoom = { roomId: string; inviteToken: string }

/** Legt einen Raum an und macht die aufrufende Person zum ersten Mitglied. */
export async function createRoom(
  client: AppSupabaseClient,
  displayName: string,
  roomName: string | null = null,
): Promise<CreatedRoom> {
  // Ohne Raumnamen bleibt der Aufruf wie vor Paket 022 und funktioniert auch ohne die Migration.
  const { data, error } = await client.rpc(
    'create_room',
    roomName === null
      ? { p_display_name: displayName }
      : { p_display_name: displayName, p_room_name: roomName },
  )
  if (error) throw toRoomError(error)
  const result = readObject(data)
  return {
    roomId: expectString(result.room_id, 'room_id'),
    inviteToken: expectString(result.invite_token, 'invite_token'),
  }
}

/**
 * Tritt einem Raum per Einladungstoken bei. Wiederholte Aufrufe sind unschädlich; sie
 * aktualisieren höchstens den Anzeigenamen.
 */
export async function joinRoom(
  client: AppSupabaseClient,
  inviteToken: string,
  displayName: string,
): Promise<{ roomId: string }> {
  const { data, error } = await client.rpc('join_room', {
    p_invite_token: inviteToken,
    p_display_name: displayName,
  })
  if (error) throw toRoomError(error)
  return { roomId: expectString(readObject(data).room_id, 'room_id') }
}

/**
 * Verlässt den Raum und entfernt die eigene Stimme. Wer schon kein Mitglied mehr ist
 * (z. B. nach Doppelklick), gilt als erfolgreich ausgetreten.
 */
export async function leaveRoom(
  client: AppSupabaseClient,
  roomId: string,
): Promise<void> {
  const { error } = await client.rpc('leave_room', { p_room_id: roomId })
  if (error) {
    const roomError = toRoomError(error)
    if (roomError.code === 'not_member') return
    throw roomError
  }
}

/** Einladungstoken eines Raums (nur für Mitglieder), um den Link zu kopieren. */
export async function getInviteToken(
  client: AppSupabaseClient,
  roomId: string,
): Promise<string> {
  const { data, error } = await client.rpc('get_invite_token', {
    p_room_id: roomId,
  })
  if (error) throw toRoomError(error)
  return expectString(data, 'invite_token')
}
