# 022 – Optionaler Raumname

- **Status:** Blockiert (Datenbankmigration muss im Supabase-Projekt angewendet werden)
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

Noch nicht bearbeitet.
