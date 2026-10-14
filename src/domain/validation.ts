/** Limits as in the database (see docs/data-and-action-contract.md). */
export const MAX_NAME_LENGTH = 40
export const MAX_TITLE_LENGTH = 120
export const MAX_ROOM_NAME_LENGTH = 60

/** Characters are counted as Unicode characters, like PostgreSQL's `char_length`. */
function length(text: string): number {
  return [...text].length
}

export type NameCheck =
  | { ok: true; name: string }
  | { ok: false; message: string }

export type RoomNameCheck =
  | { ok: true; name: string | null }
  | { ok: false; message: string }

/** The room name is optional: empty means "no name". */
export function checkRoomName(input: string): RoomNameCheck {
  const name = input.trim()
  if (length(name) > MAX_ROOM_NAME_LENGTH) {
    return {
      ok: false,
      message: `The room name may be at most ${MAX_ROOM_NAME_LENGTH} characters long.`,
    }
  }
  return { ok: true, name: name === '' ? null : name }
}

/** Trims surrounding whitespace and checks the length. The database checks again. */
export function checkDisplayName(input: string): NameCheck {
  const name = input.trim()
  if (length(name) < 1) return { ok: false, message: 'Please enter a name.' }
  if (length(name) > MAX_NAME_LENGTH) {
    return {
      ok: false,
      message: `The name may be at most ${MAX_NAME_LENGTH} characters long.`,
    }
  }
  return { ok: true, name }
}
