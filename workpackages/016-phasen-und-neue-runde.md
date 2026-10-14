# 016 – Phasenabhängige Aktionen und „Noch einmal schätzen“

- **Status:** Offen
- **Abhängigkeiten:** 015
- **Meilenstein:** M6: UX-Iteration 1
- **Herkunft:** UX-Bewertung (Punkt 2), Priorität hoch, Aufwand mittel

## Ziel

Der Ablauf gliedert sich in drei eindeutige Phasen mit je einer Hauptaktion. Das Formular
„Neue Runde“ konkurriert nicht mehr mit einer laufenden Abstimmung.

| Phase | Hauptaktion |
| --- | --- |
| Noch keine Runde | Schätzung starten |
| Abstimmung läuft | Karte wählen, danach Aufdecken |
| Ergebnis sichtbar | Nächste Story |

## Aufgaben

- Phase aus dem vorhandenen Rundenstatus ableiten; nur die passende Hauptaktion hervorheben.
- „Neue Runde“ während laufender Abstimmung zurücknehmen (z. B. nachrangige Aktion).
- „Noch einmal schätzen“: dieselbe Story mit gleichem Titel erneut starten, ohne den Titel
  nochmals einzugeben. Prüfen, ob der Aktionsvertrag (002) dafür erweitert werden muss oder der
  Client die bestehende Aktion „Runde starten“ mit altem Titel nutzen kann.
- Beim Ersetzen einer laufenden Runde mit vorhandenen Stimmen bestätigen lassen:
  „Laufende Abstimmung ersetzen? Die bisherigen Stimmen werden entfernt.“
- Konkurrierende Aktionen (011) weiterhin korrekt behandeln.

## Abnahmekriterien

- In jeder Phase ist genau eine Hauptaktion eindeutig erkennbar.
- „Noch einmal schätzen“ entfernt die alten Stimmen und übernimmt den Titel.
- Eine laufende Abstimmung mit Stimmen wird nicht ohne Rückfrage ersetzt.
- Typecheck, Lint, Build; manuelle Prüfung mit zwei getrennten Browserprofilen.

## Prüfung und Ergebnis

Noch nicht bearbeitet.
