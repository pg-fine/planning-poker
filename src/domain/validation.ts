/** Grenzen wie in der Datenbank (siehe docs/daten-und-aktionsvertrag.md). */
export const MAX_NAME_LENGTH = 40
export const MAX_TITLE_LENGTH = 120
export const MAX_ROOM_NAME_LENGTH = 60

/** Zeichen werden wie in PostgreSQL (`char_length`) als Unicode-Zeichen gezählt. */
function length(text: string): number {
  return [...text].length
}

export type NameCheck =
  | { ok: true; name: string }
  | { ok: false; message: string }

export type RoomNameCheck =
  | { ok: true; name: string | null }
  | { ok: false; message: string }

/** Raumname ist optional: leer bedeutet „kein Name“. */
export function checkRoomName(input: string): RoomNameCheck {
  const name = input.trim()
  if (length(name) > MAX_ROOM_NAME_LENGTH) {
    return {
      ok: false,
      message: `Der Raumname darf höchstens ${MAX_ROOM_NAME_LENGTH} Zeichen lang sein.`,
    }
  }
  return { ok: true, name: name === '' ? null : name }
}

/** Entfernt Leerraum am Rand und prüft die Länge. Die Datenbank prüft erneut. */
export function checkDisplayName(input: string): NameCheck {
  const name = input.trim()
  if (length(name) < 1) return { ok: false, message: 'Bitte gib einen Namen ein.' }
  if (length(name) > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `Der Name darf höchstens ${MAX_NAME_LENGTH} Zeichen lang sein.`,
    }
  }
  return { ok: true, name }
}
