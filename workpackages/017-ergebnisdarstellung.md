# 017 – Ergebnisverteilung und präzisere Ergebnistexte

- **Status:** Offen
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

Noch nicht bearbeitet.
