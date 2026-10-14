# 020 – Teilnehmerstatus „abgestimmt / noch offen“

- **Status:** Blockiert (Definition der Schätzgruppe nötig)
- **Abhängigkeiten:** 016
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 3), Priorität hoch, Aufwand mittel (mit Präsenz größer)

## Ziel

Die Frage „Warten wir noch auf jemanden?“ ist beantwortbar, ohne Kartenwerte vorab zu verraten.

## Offene Entscheidung

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

Noch nicht bearbeitet.
