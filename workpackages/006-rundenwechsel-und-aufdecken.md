# 006 – Rundenwechsel und Aufdecken

- **Status:** Erledigt
- **Abhängigkeiten:** 005
- **Meilenstein:** M2

## Ziel

Alle Mitglieder können eine Runde konsistent starten und manuell aufdecken.

## Aufgaben

- Datenbankfunktionen für neue Runde und Aufdecken bereitstellen.
- Mitgliedschaft und Titel serverseitig validieren.
- Bei neuer Runde eine frische Runden-ID erzeugen und alte Stimmen/Rundendaten entfernen.
- Austausch in einer Transaktion durchführen und konkurrierende Mutationen durch
  Sperren sowie Prüfung der erwarteten Runden-ID koordinieren.
- Aufdecken nur auf die erwartete aktuelle Runde anwenden; mehrfaches Aufdecken
  derselben Runde ohne weitere Zustandsänderung beantworten.
- Auch eine Runde ohne Stimmen darf manuell aufgedeckt werden.
- Fachliche Konflikte in strukturierte Fehler für die Oberfläche übersetzen.

## Abnahmekriterien

- Ein Rundenwechsel entfernt alte Stimmen vollständig und öffnet die neue Abstimmung.
- Zwei gleichzeitige Rundenwechsel mit gleicher erwarteter ID ersetzen nicht unbemerkt
  die gerade neu erzeugte Runde; nur einer wird akzeptiert.
- Ein verspätetes Aufdecken der vorherigen Runde deckt nicht die neue Runde auf.
- Alle Mitglieder haben dieselben Rechte, fremde Nutzer keine Steuerrechte.

## Prüfung und Ergebnis

Umsetzung:

- `supabase/migrations/20261014090300_runden.sql`: `start_round`, `reveal_round`,
  `get_room_state` sowie intern `private.lock_room_as_member` (Mitgliedschaft prüfen, Raumzeile
  sperren, erneut prüfen) und `private.room_snapshot` (ein einziges SQL-Statement, damit der
  Snapshot konsistent ist).
- `src/supabase/rounds.ts` (`startRound`, `revealRound`), `src/supabase/roomState.ts`
  (`getRoomState`, geprüfte Typen `RoomState`), `src/domain/cards.ts` (Kartenmenge).

Lokal geprüft (PostgreSQL 17 in Docker, mehrere Nutzer; kein Testcode eingecheckt):

- Erste Runde: Titel wird getrimmt, Titel leer/`null`/121 Zeichen → `invalid_title`;
  `start_round` mit `expected = null`, obwohl es schon eine Runde gibt → `round_conflict`.
- Neue Runde mit korrekter erwarteter ID entfernt alle Stimmen, vergibt neue `round_id`, Status
  `open`. Zweiter Klick mit der alten ID → `round_conflict`, die neuere Runde bleibt.
- Acht gleichzeitige `start_round` mit gleicher erwarteter ID: genau einer gewinnt, sieben
  erhalten `round_conflict`.
- Aufdecken: wirkt nur für die übergebene Runde. Wiederholtes Aufdecken lässt Zustand und
  Revision unverändert. Verspätetes Aufdecken der alten Runde deckt die neue nicht auf.
  Ohne Runde `no_round`. Aufdecken und Rundenwechsel gleichzeitig enden in einem konsistenten Stand.
- Fremde Personen und unbekannte Räume erhalten überall `not_member`; `anon` hat kein Ausführungsrecht.
- Snapshot enthält `me`, Mitglieder, Runde samt Stimmen und Revision. Das Frontend parst ihn
  streng (ungültige Karte wird abgelehnt). Typecheck und Lint sind fehlerfrei.

Im echten Supabase-Projekt bestätigt: Alle Migrationen sind angewendet. Ein vollständiger Ablauf
mit drei anonymen Identitäten über die TypeScript-Module der App (Raum erstellen, Beitreten,
Token, Runde, Abstimmen und Ändern, Aufdecken, neue Runde, Konflikte, Austritt und Wiederbeitritt,
fremde Person ohne Zugriff, direkte Schreibzugriffe gesperrt) lief mit 21 von 21 Prüfungen
fehlerfrei. Dabei ist ein Testraum im Projekt entstanden (ohne Bedeutung).
