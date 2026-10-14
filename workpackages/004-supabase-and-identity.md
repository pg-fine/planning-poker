# 004 – Supabase-Verbindung und Identität

- **Status:** Erledigt (Anmeldung im Browser-UI noch nicht von dir gesehen)
- **Abhängigkeiten:** 001
- **Meilenstein:** M1

## Ziel

Teilnehmenden ohne Registrierung eine wiedererkennbare Browser-Identität geben.

## Aufgaben

- Supabase-Client mit Projekt-URL und öffentlichem Publishable-/Anon-Key konfigurieren.
- Aktivieren anonymer Anmeldung im Supabase-Projekt dokumentieren.
- Bestehende Session laden; nur bei fehlender Session anonym anmelden.
- Gleichzeitige Initialisierung innerhalb der App deduplizieren.
- Session-Wiederherstellung, Ladezustand und Auth-Fehler bereitstellen.
- Anzeigenamen als fachliche Eingabe behandeln, nicht als Authentifizierung.
- Verhalten bei gelöschten Browserdaten oder abgelaufener Session dokumentieren.

## Abnahmekriterien

- Beim ersten Einstieg entsteht ohne E-Mail/Passwort eine anonyme Identität.
- Neuladen nutzt die vorhandene Identität wieder.
- Zusätzliche Tabs mit bereits gespeicherter Session verwenden dieselbe Identität.
- Bei Auth-Fehlern bleibt eine verständliche Meldung mit erneutem Versuch sichtbar.
- Fehlende Konfiguration und nicht aktivierte anonyme Anmeldung sind unterscheidbar.

## Prüfung und Ergebnis

Umsetzung:

- `src/supabase/client.ts`: ein gemeinsamer Client je Fenster (Session im `localStorage`,
  keine URL-Auswertung).
- `src/supabase/identity.ts`: `ensureIdentity` (Session wiederverwenden, ungültige Session
  verwerfen, sonst anonym anmelden; Dedupe innerhalb der App, Browser-Sperre über Tabs;
  Fehlerarten `anonymous_disabled`, `rate_limited`, `network`, `unknown`) und deutsche Meldungen.
- `src/ui/useIdentity.ts`, `src/ui/IdentityGate.tsx`: Ladezustand, Fehler mit
  „Erneut versuchen“, Bereit-Ansicht mit gekürzter Kennung des Browsers.
- `docs/identity.md`: Verhalten bei gelöschten Browserdaten, anderem Profil, ungültiger
  Session und die Fehlerarten.

Gegen das echte Supabase-Projekt geprüft (Node-Skripte mit dateibasiertem `localStorage`
als „Browser-Profil“, kein Testcode eingecheckt):

- Erste Anmeldung ohne E-Mail/Passwort erzeugt eine anonyme Identität (`is_anonymous`).
- Drei gleichzeitige Aufrufe teilen sich einen Vorgang und liefern dieselbe ID.
- Neuladen (gleiches Profil, zweimal) behält dieselbe ID; ein anderes Profil bekommt eine neue.
- Absichtlich beschädigte Session wird verworfen und durch eine neue Identität ersetzt.
- Unerreichbare Adresse ergibt `network`, falscher Key `unknown`; ein erneuter Aufruf
  startet jeweils einen neuen Versuch.
- Als angemeldete anonyme Person ohne Mitgliedschaft: `rooms`, `room_members`, `rounds`,
  `votes` liefern 0 Zeilen, `room_invites` und jedes Schreiben werden mit `42501 permission
  denied` abgewiesen. Damit sind Migration und Leserechte aus Arbeitspaket 003 im echten
  Projekt bestätigt (Prüfung mit dem öffentlichen Key).
- Typecheck, Lint und Build sind fehlerfrei.

Nicht geprüft:

- Der Fall „anonyme Anmeldung deaktiviert“ (Schalter ist bei dir aktiv; Fehlercode wird nur
  anhand der Supabase-Dokumentation erkannt) und der Rate-Limit-Fall.
- Die Darstellung im echten Browser und das Verhalten mehrerer Tabs (die Browser-Sperre
  ist nur durch Code-Review abgesichert).

Bitte einmal `npm run dev` starten: Es sollte „Bereit“ mit einer Kennung erscheinen, die
nach Neuladen und in einem zweiten Tab gleich bleibt, in einem Privatfenster aber anders ist.
Beim Testen sind einige anonyme Testnutzer im Projekt entstanden (unter Authentication →
Users sichtbar, ohne Bedeutung, dürfen gelöscht werden).
