# 005 – Raumzugang und Mitgliedschaft

- **Status:** Erledigt
- **Abhängigkeiten:** 003, 004
- **Meilenstein:** M2

## Ziel

Dauerhafte Räume über einen Einladungslink zugänglich machen und Zugriffe begrenzen.

## Aufgaben

- Datenbankfunktionen für Raum erstellen, mit Token beitreten und Raum verlassen implementieren.
- Kryptografisch zufälliges Einladungstoken mit mindestens 128 Bit Entropie erzeugen.
- Raum-Erstellung und erste Mitgliedschaft in einer Transaktion durchführen.
- Namen serverseitig validieren und Mitgliedschaft pro Nutzer/Raum eindeutig halten.
- Erneutes Beitreten idempotent gestalten und Namensänderung ermöglichen.
- Raum-Mitgliedern das Kopieren des bestehenden Links ermöglichen, ohne eine öffentliche
  Liste von Räumen oder Tokens anzubieten.
- Beim Verlassen Mitgliedschaft und eigene aktuelle Stimme atomar entfernen;
  Runde und Raum bleiben erhalten.
- Bei privilegierten SQL-Funktionen Authentifizierung und Berechtigung explizit prüfen,
  Ausführungsrechte begrenzen und einen festen `search_path` verwenden.
- Typisierte Frontend-Zugriffsfunktionen bereitstellen.

## Abnahmekriterien

- Ein Link führt wiederholt in denselben Raum; es gibt keine automatische Ablaufzeit.
- Ungültige Tokens erzeugen keine Mitgliedschaft und verraten keine fremden Raumdaten.
- Erneutes Beitreten derselben Identität erzeugt kein Duplikat.
- Nach Verlassen sind direkte Raumabfragen gesperrt; erneuter Beitritt per Link funktioniert.

## Prüfung und Ergebnis

Umsetzung:

- `supabase/migrations/20261014090200_raumzugang.sql`: `create_room`, `join_room`,
  `leave_room`, `get_invite_token` (SECURITY DEFINER, leerer `search_path`, `auth.uid()`
  aus der Session, Ausführung nur für `authenticated`, nicht für `anon`) und die interne
  Namensprüfung `private.normalize_display_name`.
- `src/supabase/rooms.ts`: typisierte Funktionen `createRoom`, `joinRoom`, `leaveRoom`,
  `getInviteToken`, Fehlercodes als `RoomError` mit deutschen Meldungen.
- Einladungstoken: zwei zufällige UUIDs ohne Bindestriche (64 Hex-Zeichen, ca. 244 Bit),
  damit keine Erweiterung (pgcrypto) nötig ist. Der Vertrag wurde entsprechend angepasst.

Lokal geprüft (PostgreSQL 17 in Docker, Supabase-Rollen und `auth.uid()` nachgebildet,
mehrere Nutzer; kein Testcode eingecheckt):

- `anon` darf keine der Funktionen ausführen; ohne Nutzer-ID in der Session `not_authenticated`.
- Ungültige Namen (leer, nur Leerraum, `null`, 41 Zeichen) → `invalid_name`; Leerraum am Rand
  wird entfernt. Ungültiges oder fehlendes Token → `invalid_token`, ohne Raumdaten preiszugeben.
- Beitritt ist idempotent: wiederholtes Beitreten erzeugt kein Duplikat; Namensänderung
  erhöht die Raumrevision, ein gleicher Name nicht (Revision 1 → 2 → 3 → 4 bei Austritt).
- Zwölf gleichzeitige Beitritte derselben Person mit wechselnden Namen: kein Fehler, genau eine
  Mitgliedschaft (Raumsperre).
- Fremde Personen erhalten für Token und Austritt `not_member`, auch für nicht existierende Räume.
- Austritt entfernt Mitgliedschaft und eigene Stimme; Raum, Runde und fremde Stimmen bleiben.
  Danach sind Raumabfragen und Token gesperrt; erneuter Beitritt per Link klappt, die alte
  Stimme kommt nicht zurück. Direkte Schreibzugriffe und `room_invites` bleiben gesperrt.
- Typecheck, Lint und Build sind fehlerfrei.

Im echten Supabase-Projekt bestätigt: Alle Migrationen sind angewendet. Ein vollständiger Ablauf
mit drei anonymen Identitäten über die TypeScript-Module der App (Raum erstellen, Beitreten,
Token, Runde, Abstimmen und Ändern, Aufdecken, neue Runde, Konflikte, Austritt und Wiederbeitritt,
fremde Person ohne Zugriff, direkte Schreibzugriffe gesperrt) lief mit 21 von 21 Prüfungen
fehlerfrei. Dabei ist ein Testraum im Projekt entstanden (ohne Bedeutung).
