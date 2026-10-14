# 003 – Datenbankschema und Leserechte

- **Status:** Erledigt
- **Abhängigkeiten:** 002
- **Meilenstein:** M1

## Ziel

Versionierbare SQL-Migrationen für die aktuelle Runde und raumgebundene Daten erstellen.

## Aufgaben

- Ein Supabase-Free-Projekt durch den Nutzer anlegen lassen; erste Einrichtung dokumentieren.
- SQL-Migrationen im Repository für Räume, Mitgliedschaften, aktuelle Runden und Stimmen anlegen.
- Fremdschlüssel, eindeutige Schlüssel, Werteprüfungen und erforderliche Indizes definieren.
- Raumübergreifende Zuordnungen und Doppelstimmen durch Datenbankregeln verhindern.
- Row Level Security (RLS) für alle von der App erreichbaren Tabellen aktivieren.
- Lesen auf eigene Mitgliedschaften bzw. Räume mit eigener Mitgliedschaft begrenzen.
- Einladungstoken getrennt und nicht über normale Tabellenlesezugriffe zugänglich halten;
  nur benötigte Zugangsfunktionen dürfen darauf zugreifen.
- Schreibzugriff zunächst sperren; Freigaben erfolgen gezielt über folgende Pakete.
- Falls eine Membership-Hilfsfunktion nötig ist, rekursive RLS-Abfragen vermeiden und
  Funktionsrechte sowie einen festen `search_path` berücksichtigen.

## Abnahmekriterien

- Migrationen lassen sich auf einem leeren Supabase-Projekt in Reihenfolge anwenden.
- Unangemeldete Zugriffe und Zugriffe fremder Nutzer liefern keine Raumdaten.
- RLS-Rechte sind auch mit dem öffentlichen Client-Key wirksam.
- Constraints verhindern ungültige Karten und doppelte Stimmen derselben Identität.

## Prüfung und Ergebnis

Umsetzung:

- `supabase/migrations/20261014090000_tables.sql`: Tabellen, Fremdschlüssel, Prüfregeln, Indizes.
- `supabase/migrations/20261014090100_access_rights.sql`: RLS, Rechte, Leserichtlinien.
- `docs/supabase-setup.md`: erste Einrichtung (Projekt, Migrationen, Schlüssel).

Der Mitgliedschaftstest läuft über `private.is_room_member` (SECURITY DEFINER, fester
`search_path`, Schema `private` nicht über die API veröffentlicht), dadurch gibt es keine
rekursive Policy. Zusammengesetzte Fremdschlüssel erzwingen, dass Stimmen zur aktuellen
Runde desselben Raums und zu einem Mitglied dieses Raums gehören. Beim Austritt entfällt die
Stimme automatisch. `round_id` hat bewusst kein `ON UPDATE CASCADE`: ein Rundenwechsel muss
zuerst die Stimmen löschen (Funktion in Arbeitspaket 006).

Lokal geprüft (PostgreSQL 17 in Docker, Supabase-Rollen `anon`/`authenticated` und
`auth.uid()` nachgebildet; kein Testcode eingecheckt):

- Beide Migrationen laufen in Reihenfolge fehlerfrei auf einer leeren Datenbank.
- Ungültige Daten werden abgewiesen: leerer, ungetrimmter und zu langer Name, zweite Runde je
  Raum, ungültiger Status, ungültige Karte, doppelte Stimme, Stimme einer Nicht-Mitglied-
  Person, Stimme mit Runde eines anderen Raums, zu kurzes Token. Karten `coffee` und `?` sind erlaubt.
- Änderung der `round_id` bei vorhandenen Stimmen scheitert; nach Löschen der Stimmen klappt sie.
- `anon`: `permission denied` auf allen Tabellen. Angemeldete Person sieht nur Daten ihres
  Raums, Person ohne Mitgliedschaft und Session ohne `sub` sehen nichts.
- `room_invites` ist für `authenticated` nicht lesbar; INSERT/UPDATE/DELETE sind auf allen
  Tabellen abgewiesen. Rechteübersicht: ausschließlich `SELECT` für `authenticated` auf vier
  Tabellen, RLS überall aktiv. Die Supabase-Standardrechte wurden dafür nachgebildet.

Im echten Supabase-Projekt bestätigt (bei Arbeitspaket 004): Als angemeldete anonyme Person
ohne Mitgliedschaft liefern alle Lesezugriffe mit dem öffentlichen Key 0 Zeilen, `room_invites`
und alle Schreibzugriffe werden mit `permission denied` abgewiesen.
