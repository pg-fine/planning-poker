# 020 – Teilnehmerstatus „abgestimmt / noch offen“

- **Status:** Erledigt
- **Abhängigkeiten:** 016
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 3), Priorität hoch, Aufwand mittel (mit Präsenz größer)

## Ziel

Die Frage „Warten wir noch auf jemanden?“ ist beantwortbar, ohne Kartenwerte vorab zu verraten.

## Entscheidung (vom Auftraggeber getroffen)

Schätzgruppe = Mitglieder, die gerade im Raum online sind (Presence). Details unten.

Ursprüngliche Fragestellung:

Die Mitgliederliste enthält auch Personen früherer Sitzungen. Daraus darf kein Fortschritt wie
„3 von 12“ entstehen (siehe README, Betriebsgrenzen). Zu klären ist, wer zur aktuellen Schätzgruppe
zählt, z. B. ausdrücklich Teilnehmende dieser Runde. Online-Präsenz allein sagt nicht, ob jemand
mitschätzt oder zusieht.

## Aufgaben (nach Entscheidung)

- Definition der Schätzgruppe in `docs/daten-und-aktionsvertrag.md` festhalten.
- Personen mit Initialen und neutralem Status zeigen (✓ abgestimmt / noch keine Stimme); Werte
  bleiben verborgen.
- Fortschrittsanzeige „x von y abgestimmt“ nur auf Basis der definierten Gruppe.
- Gegebenenfalls Schema, Leserechte und Echtzeit (003, 010) erweitern.

## Abnahmekriterien

- Frühere Mitglieder erzeugen keine fehlenden Stimmen in der Fortschrittsanzeige.
- Status ist nicht nur durch Farbe erkennbar.
- Typecheck, Lint, Build; Prüfung mit mindestens zwei getrennten Profilen.

## Prüfung und Ergebnis

Änderungen:

- `useRoomState.ts`: eigener Presence-Kanal `presence:<room_id>` mit gemeinsamem Namen (der Datenkanal
  hat je Tab einen eindeutigen Namen und taugt dafür nicht); übertragen wird nur die Nutzer-ID.
  Ergebnis: `onlineIds` (`null`, solange unbekannt).
- `Participants.tsx` ersetzt die Mitgliederliste: Überschrift „Online (n)“, Initialen, pro Person
  „✓ abgestimmt“ oder „noch keine Stimme“ während einer offenen Runde, Fortschritt
  „x von y abgestimmt“ nur über die Online-Mitglieder. Nicht Online-Mitglieder stehen eingeklappt
  unter „Nicht online (n)“ und zeigen nur einen Haken, falls sie abgestimmt haben. Ohne Live-Verbindung
  fällt die Anzeige auf die Mitgliederliste ohne Fortschritt zurück.
- Kartenwerte bleiben bis zum Aufdecken verborgen. Status ist Text (nicht nur Farbe).
- `docs/daten-und-aktionsvertrag.md`: Abschnitt „Anwesenheit“, inklusive Grenzen.
- Keine Datenbankänderung nötig.

Geprüft (Headless-Chromium über Playwright, drei getrennte Profile, echtes Supabase-Projekt):
3 Online, 0 von 3; nach Stimme von Ben 1 von 3; nach Schließen von Bens Fenster 0 von 2 und Ben
unter „Nicht online“ mit „✓ abgestimmt“; axe-core ohne Befunde. Typecheck, Lint, Build fehlerfrei.
Im ersten Versuch zeigte jeder nur sich selbst: Der Presence-Kanal teilte den eindeutigen
Kanalnamen des Datenkanals; behoben durch den eigenen Kanal.
Grenzen: Der Kanal ist nicht privat (siehe Vertrag). Presence unterscheidet nicht zwischen Mitschätzenden
und Zusehenden. Kurzes Wegfallen (Tab-Wechsel, Verbindungsabbruch) lässt Personen kurz als „nicht online“ erscheinen.
Nicht geprüft: React-Entwicklungsmodus (Strict Mode) mit doppeltem Effektlauf; Produktionsbuild geprüft.
