# 009 – Karten und Ergebnisse: Oberfläche

- **Status:** Erledigt
- **Abhängigkeiten:** 006, 007, 008
- **Meilenstein:** M3

## Ziel

Eine komplette Schätzrunde über die Oberfläche spielbar machen.

## Aufgaben

- Titel eingeben und erste/neue Runde starten lassen.
- Fibonacci-Karten inklusive `?` und `☕` als auswählbare Buttons darstellen.
- Eigene Auswahl kenntlich machen; weitere Auswahl bis zum Aufdecken ermöglichen.
- Vor dem Aufdecken nur Anzahl abgegebener Stimmen und eigene Karte anzeigen.
- Aufdecken für alle Mitglieder anbieten; danach Kartenwerte mit Namen darstellen.
- Sonderkarten ohne numerische Durchschnittsberechnung darstellen.
- Leere Runde und Runde ohne eigene Stimme sinnvoll anzeigen.
- Aktionen erst nach bestätigtem Datenbankerfolg als gespeichert darstellen.
- Nach jeder eigenen Mutation den aktuellen Zustand laden; Echtzeit folgt in 010.

## Abnahmekriterien

- Titel, Auswahl, Auswahländerung, Aufdecken und neue Runde sind ohne API-Konsole möglich.
- Fremde Karten erscheinen vor Aufdecken nicht als sichtbarer Text, Tooltip oder
  Screenreader-Beschriftung; technische Auslesbarkeit der Daten ist bewusst akzeptiert.
- Nach Aufdecken ist die Auswahl gesperrt; eine neue Runde zeigt keine alten Stimmen.
- Namen und Titel werden als Text gerendert, nicht als HTML.

## Prüfung und Ergebnis

Umsetzung:

- `RoundPanel` (Runde starten, Karten, Aufdecken, neue Runde), `CardDeck` (Kartenauswahl mit
  `aria-pressed` und Text „gewählt“), `RevealedResults` (Namen mit Karten, Verteilung, Einigkeit),
  `src/domain/results.ts` (Auswertung; Mittelwert nur über Zahlenkarten, Sonderkarten zählen nicht).
- `useRoomState` übernimmt Zustände der eigenen Aktionen und verwirft solche mit älterer Revision.
- Nur bestätigte Datenbankantworten werden dargestellt (keine optimistische Anzeige).
  Nach `round_conflict`/`round_not_open` lädt die Ansicht den aktuellen Stand neu und nennt das.
- Vor dem Aufdecken zeigt die Oberfläche nur die Anzahl der Stimmen und die eigene Karte. Fremde
  Kartenwerte stehen nicht im DOM (Text, Labels, Tooltips). Technisch bleiben sie für Mitglieder
  abrufbar (bewusste Entscheidung). Die Zahl „Abgegebene Stimmen“ ist keine Liste Pflichtabstimmender.
- Titel und Namen werden als Text gerendert.

Im Browser geprüft (Headless-Chromium über Playwright außerhalb des Projekts, zwei getrennte
Profile, echtes Supabase-Projekt; kein Testcode eingecheckt):

- Erste Runde: leerer Titel → Fehler; Titel `<b>STORY-1</b> Login` erscheint als Text.
- Karte wählen und ändern (8 → 13): genau eine Karte gewählt, Stimmenzahl bleibt 1.
- Zweite Person sieht die Runde und die Stimmenzahl, aber nicht die Karte der ersten.
- Aufdecken: Namen mit Karten (inkl. `☕`), Verteilung, Mittelwert nur der Zahlenkarten;
  danach keine Kartenauswahl mehr. Aufdecken ohne Stimmen: „Niemand hat abgestimmt.“
  Gleiche Karten: Hinweis auf Einigkeit. Neuladen nach dem Aufdecken zeigt das Ergebnis weiter.
- Neue Runde: keine alten Stimmen, nichts gewählt. Veraltete Ansicht (noch ohne Live-Update):
  Stimme nach dem Aufdecken und zweiter Rundenstart liefern die passende Meldung und aktualisieren.
- Schmale Ansicht (380 px) ohne horizontales Scrollen; keine JavaScript-Fehler.
- Typecheck, Lint und Build sind fehlerfrei.

Bekannt und für spätere Pakete vorgesehen: Andere Personen sehen Änderungen noch erst nach
Neuladen oder eigener Aktion (010 Echtzeit); ein erneuter Versuch nach Verbindungsproblemen und
Konfliktfeinschliff folgen in 011.
