# 007 – Stimmen speichern und ändern

- **Status:** Erledigt
- **Abhängigkeiten:** 006
- **Meilenstein:** M2

## Ziel

Pro Identität genau eine gültige Stimme für die offene aktuelle Runde speichern.

## Aufgaben

- Datenbankfunktion zur Stimmabgabe mit Raum-/Runden-ID und Kartenwert implementieren.
- Nutzer-ID aus der Auth-Session ableiten, nicht aus frei übergebenen Parametern.
- Mitgliedschaft, aktuelle Runden-ID, offenen Status und Kartenwert prüfen.
- Bestehende eigene Stimme aktualisieren statt weitere Stimmen einzufügen.
- Stimmabgabe mit Aufdecken/Rundenwechsel über dieselbe Sperrstrategie koordinieren.
- Lesen aller Stimmen nur für Raum-Mitglieder erlauben; Werte werden bewusst bereits
  vor dem Aufdecken ausgeliefert und später durch die UI verborgen.
- Frontend-Zugriff mit typisierten Ergebnissen und fachlichen Fehlern ergänzen.

## Abnahmekriterien

- Eine zweite Auswahl ersetzt die erste; die Stimmenanzahl bleibt gleich.
- Stimmen für alte oder aufgedeckte Runden werden abgelehnt.
- Fremde Stimmen können nicht verändert werden, auch nicht durch direkte API-Aufrufe.
- Gleichzeitiges Aufdecken und Abstimmen hat ein konsistentes Ergebnis:
  Stimme vor Aufdecken angenommen oder nach Aufdecken abgewiesen.

## Prüfung und Ergebnis

Umsetzung:

- `supabase/migrations/20261014090400_votes.sql`: `cast_vote(room_id, round_id, card)`.
  Nutzer-ID nur aus der Session. Prüfreihenfolge: Mitgliedschaft, Karte, Runde vorhanden,
  Runden-ID aktuell, Runde offen. Upsert auf (Raum, Person); gleiche Karte erneut ändert nichts.
- `src/supabase/votes.ts`: `castVote` mit typisiertem `CardValue`.
- Lesen aller Stimmen für Mitglieder erfolgt über den Snapshot (und RLS aus 003). Die Werte
  werden bewusst schon vor dem Aufdecken geliefert; die Oberfläche verbirgt sie (009).

Lokal geprüft (PostgreSQL 17 in Docker, mehrere Nutzer; kein Testcode eingecheckt):

- Ungültige Karten (`4`, `null`, `coffee ` mit Leerzeichen) → `invalid_card`; Fremde und
  unbekannte Räume → `not_member`; `anon` hat kein Ausführungsrecht.
- Zweite Auswahl ersetzt die erste, die Stimmenzahl bleibt gleich. Eine Karte erneut zu senden
  ändert Revision und Stimme nicht; echte Änderungen erhöhen die Revision um 1.
- Sonderkarten `?` und `coffee` werden gespeichert.
- Fremde Stimmen lassen sich per direktem Zugriff weder ändern, einfügen noch löschen.
- Nach dem Aufdecken → `round_not_open`, Stimmen unverändert. Nach Rundenwechsel → `round_conflict`
  für die alte Runden-ID, die neue Runde bleibt leer.
- Austritt entfernt die eigene Stimme.
- Sechs gleichzeitige Stimmabgaben derselben Person plus gleichzeitiges Aufdecken: genau eine
  Stimme bleibt bestehen; vor dem Aufdecken angenommene Stimmen sind gültig, eine danach
  eintreffende erhält `round_not_open`.
- Typecheck und Lint sind fehlerfrei.

Im echten Supabase-Projekt bestätigt: Alle Migrationen sind angewendet. Ein vollständiger Ablauf
mit drei anonymen Identitäten über die TypeScript-Module der App (Raum erstellen, Beitreten,
Token, Runde, Abstimmen und Ändern, Aufdecken, neue Runde, Konflikte, Austritt und Wiederbeitritt,
fremde Person ohne Zugriff, direkte Schreibzugriffe gesperrt) lief mit 21 von 21 Prüfungen
fehlerfrei. Dabei ist ein Testraum im Projekt entstanden (ohne Bedeutung).
