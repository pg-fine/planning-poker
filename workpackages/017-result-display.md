# 017 – Ergebnisverteilung und präzisere Ergebnistexte

- **Status:** Erledigt
- **Abhängigkeiten:** 015
- **Meilenstein:** M6: UX-Iteration 1
- **Herkunft:** UX-Bewertung (Punkt 4), Priorität hoch, Aufwand klein bis mittel

## Ziel

Das aufgedeckte Ergebnis ist Ausgangspunkt der Diskussion: Unterschiede in den Einschätzungen
sind auf einen Blick erkennbar.

## Aufgaben

- Verteilung als einfache Balkendarstellung (Wert, Balken, Anzahl „3 Stimmen“/„1 Stimme“);
  Balken zusätzlich per Text/Zahl lesbar, nicht nur grafisch.
- Darunter bleiben Personen und ihre Werte sichtbar.
- Mittelwert nachrangig darstellen, nicht als empfohlene Endschätzung.
- „Einigkeit“ präzisieren (Logik in `src/domain/results.ts`):
  - Alle Zahlenstimmen gleich: „Alle abgegebenen Schätzungen liegen bei 5.“
  - Nur `?`: „Alle abgegebenen Stimmen: noch unklar.“
  - Nur `☕`: „Alle abgegebenen Stimmen: Kaffeepause.“
- Sonderkarten nicht als Einigkeit über den Aufwand werten.
- Randfälle: keine Stimmen, eine Stimme, Mischung aus Zahlen und Sonderkarten.

## Abnahmekriterien

- Gleiche Sonderkarten erzeugen keine Aussage über Einigkeit beim Aufwand.
- Balken sind im Hell- und Dunkelmodus kontrastreich und für Screenreader beschriftet.
- Typecheck, Lint, Build; manuelle Prüfung der Randfälle.

## Prüfung und Ergebnis

Änderungen:

- `src/domain/results.ts`: neue Funktion `describeAgreement` liefert die präzisen Aussagen
  („Alle abgegebenen Schätzungen liegen bei 5.“, „… noch unklar.“, „… Kaffeepause.“); bei weniger
  als zwei Stimmen oder gemischten Stimmen gibt es keine Aussage.
- `src/ui/RevealedResults.tsx`: Abschnitt „Verteilung“ mit Balken, Kartenwert und Text „n Stimme(n)“
  (Balken `aria-hidden`, die Anzahl steht immer als Text; Sonderkarten in neutraler Farbe), darunter
  „Wer hat was gewählt?“. Der Mittelwert steht nachrangig als „Rechnerischer Mittelwert … nur ein
  Anhaltspunkt“.

Geprüft (Headless-Chromium über Playwright, zwei getrennte Profile, echtes Supabase-Projekt, kein
Testcode eingecheckt): gemischte Stimmen (5/8), gleiche Zahl, nur `?`, nur `☕`, `?` mit Zahl; 1000 px
hell und 320 px dunkel ohne Layoutbruch; axe-core ohne Befunde. Typecheck, Lint, Build fehlerfrei.
Nicht geprüft: sehr viele verschiedene Karten gleichzeitig, aufgedeckte Runde ohne Stimmen im Browser.
