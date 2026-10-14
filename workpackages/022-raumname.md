# 022 – Optionaler Raumname

- **Status:** Erledigt
- **Abhängigkeiten:** 021
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 5), aus 021 ausgelagert

## Ziel

Ein Raum kann einen Namen tragen, z. B. „Team Atlas – Refinement“. Er erscheint im Raum und in
der Liste „Zuletzt verwendete Räume“ statt der Token-Endung.

## Voraussetzung

Der Name gehört zum Raum und muss deshalb in der Datenbank liegen (neue Spalte `rooms.name`,
`create_room` mit optionalem Namen, Mitglieder dürfen ihn lesen und ändern). Die neue Migration
muss von dir im Supabase-Projekt angewendet werden; ich habe darauf keinen Zugriff.

## Aufgaben

- Neue Migration `supabase/migrations/…_raumname.sql`: Spalte, Längenprüfung (z. B. 1–60 Zeichen),
  `create_room(p_display_name, p_room_name)` mit Standardwert, Funktion zum Ändern durch Mitglieder.
  Bestehende Räume bleiben ohne Namen gültig.
- `docs/daten-und-aktionsvertrag.md` und `docs/supabase-einrichtung.md` ergänzen.
- Formularfeld „Raumname (optional)“ auf der Startseite; Anzeige im Raumkopf und in der Liste.
- Raumname im Raum ändern können.
- Rückwärtskompatibilität: Die App muss mit der alten Datenbank weiterlaufen, bis die Migration
  angewendet ist, oder die Reihenfolge der Bereitstellung ist dokumentiert.

## Abnahmekriterien

- Räume ohne Namen verhalten sich unverändert.
- Der Name ist nur für Mitglieder des Raums lesbar und änderbar (Datenisolation aus 003 bleibt).
- Typecheck, Lint, Build; manuelle Prüfung mit zwei Profilen.

## Prüfung und Ergebnis

Migration `supabase/migrations/20261014090700_raumname.sql`:

- `rooms.name` (NULL oder 1-60 Zeichen, ohne Leerraum am Rand), `create_room(display_name, room_name
  default null)` (alte Aufrufe mit einem Argument funktionieren weiter), `set_room_name` für
  Mitglieder, Snapshot mit `name`. Neue Fehlermeldung `invalid_room_name`.
- Die Migration baut auf `20261014090600` auf (beide ändern `room_snapshot`); Reihenfolge einhalten.

App:

- Startseite: Feld „Raumname (optional)“. Ohne Namen sendet die App den alten Aufruf, sodass das
  Erstellen auch vor dem Einspielen der Migration funktioniert.
- Raum: Name als Überschrift; „Raumnamen speichern“ unter „Raum und Hilfe“ (leer entfernt den Namen).
- „Zuletzt verwendete Räume“ zeigen den Raumnamen (sonst „Raum …“ plus Token-Ende) und halten ihn aktuell.

Geprüft: Migrationen lokal in PostgreSQL 16 (Docker): Name wird getrimmt gespeichert, ein
61-Zeichen-Name liefert `invalid_room_name`, `create_room` mit einem Argument funktioniert,
Mitglieder ändern/leeren den Namen, Nicht-Mitglieder erhalten `not_member`. Oberfläche im Browser
(Playwright): Feld auf der Startseite, Erstellen ohne Namen gegen die alte Datenbank, Überschrift,
Ändern des Namens (mit nachgestellten Antworten, da die Migration im echten Projekt noch fehlt),
Liste zeigt den Namen; axe-core ohne Befunde. Typecheck, Lint, Build fehlerfrei.
Nach dem Einspielen der Migrationen (14.10.2026) gegen das echte Supabase-Projekt geprüft: Erstellen mit
Namen (Leerraum wird entfernt), zweite Person sieht den Namen, Ändern durch die zweite Person erscheint
live bei der ersten, Leeren entfernt die Überschrift.
