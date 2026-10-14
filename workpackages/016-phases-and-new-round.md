# 016 – Phasenabhängige Aktionen und „Noch einmal schätzen“

- **Status:** Erledigt
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

Änderungen (`RoundPanel.tsx`):

- Phase „Noch keine Runde“: nur „Erste Runde starten“ mit Titelfeld.
- Phase „Abstimmung läuft“: Karten und „Karten aufdecken“ sind die Hauptaktion. Die Möglichkeit, eine
  andere Story zu starten, ist unter „Stattdessen eine andere Story schätzen“ eingeklappt und
  nachrangig dargestellt.
- Phase „Ergebnis sichtbar“: Abschnitt „Nächste Story“ mit „Nächste Story starten“ (Hauptaktion)
  und „Noch einmal schätzen“.
- „Noch einmal schätzen“ nutzt die bestehende Aktion „Runde starten“ mit dem Titel der aktuellen
  Runde. Der Aktionsvertrag (002) musste nicht erweitert werden; Konfliktbehandlung und Prüfung
  „wurde die Aktion angewendet?“ (011) greifen unverändert.
- Beim Ersetzen einer laufenden Runde mit Stimmen erscheint die Rückfrage „Laufende Abstimmung
  ersetzen? Die bisherigen Stimmen werden entfernt.“ mit „Ja, ersetzen“ und „Abbrechen“. Ohne
  Stimmen wird direkt ersetzt. Die Rückfrage gilt nur für die Runde, bei der sie gestellt wurde.

Geprüft (Headless-Chromium über Playwright, zwei getrennte Browserprofile, echtes Supabase-Projekt,
kein Testcode eingecheckt): Raum erstellen, Runde starten, Beitritt der zweiten Person; Rückfrage
erscheint mit Stimmen, Abbrechen lässt die Runde unverändert; Aufdecken zeigt „Nächste Story“ und
„Noch einmal schätzen“; Letzteres startet bei der anderen Person dieselbe Story mit 0 Stimmen;
Ersetzen ohne Stimmen erfolgt ohne Rückfrage. Typecheck, Lint, Build fehlerfrei.
Nicht geprüft: gleichzeitige Aktionen beider Personen in genau diesem Ablauf (Logik unverändert aus 011).
