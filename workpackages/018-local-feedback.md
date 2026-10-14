# 018 – Rückmeldungen nahe an der Aktion

- **Status:** Erledigt
- **Abhängigkeiten:** 015
- **Meilenstein:** M6: UX-Iteration 1
- **Herkunft:** UX-Bewertung (Punkt 7), Priorität mittel, Aufwand klein

## Ziel

Speicherstatus und Fehler erscheinen dort, wo die Aktion stattfand.

## Aufgaben

- Speichern direkt bei der Kartenwahl anzeigen; danach kurz „Deine Schätzung: 8 · gespeichert“.
- Nicht mehrere Knöpfe gleichzeitig auf „Wird gespeichert …“ setzen.
- Abstimmfehler bei den Karten, Titelfehler am Titelfeld.
- Technische Erklärungen (Browserkennung, Supabase) hinter „Hilfe“ (mit 015 abstimmen).
- Fokus- und `aria`-Verhalten aus 012 beibehalten; Statusmeldungen für Screenreader (`aria-live`).

## Abnahmekriterien

- Ein Abstimmfehler erscheint nie beim Formular für die nächste Runde und umgekehrt.
- Eingaben gehen bei Fehlern nicht verloren.
- Typecheck, Lint, Build; manuelle Prüfung inkl. simuliertem Netzwerkfehler.

## Prüfung und Ergebnis

Änderungen (`RoundPanel.tsx`, `cards.ts`):

- Laufende Aktionen und Fehler sind nach Bereich getrennt (`vote`, `reveal`, `start`): Es zeigt nur
  der Knopf des betroffenen Bereichs „Wird gespeichert …“ bzw. „Wird aufgedeckt …“; während einer
  Aktion bleiben die übrigen Aktionen wie bisher gesperrt.
- Bei der Kartenwahl steht direkt unter den Karten „Speichere deine Schätzung: 8 …“ und danach
  „Deine Schätzung: 8 · gespeichert“ (`role="status"`).
- Abstimmfehler erscheinen unter den Karten, Aufdeck-Fehler unter „Karten aufdecken“, Titelfehler
  direkt am Titelfeld (`aria-invalid`, `aria-describedby`). Der gemeinsame Fehlerblock am Ende entfällt.
- `cardDescription` aus der Ergebnisansicht liegt jetzt in `src/domain/cards.ts` und wird auch für
  die Statusmeldung genutzt.
- Technische Hinweise zu Browserkennung/Identität liegen bereits seit 015 hinter „Hilfe“.

Geprüft (Headless-Chromium über Playwright, echtes Supabase-Projekt, kein Testcode eingecheckt):
leerer Titel → Fehler am Titelfeld; Kartenwahl → „Deine Schätzung: 8 · gespeichert“; bei abgebrochenen
Anfragen erscheinen Abstimm- und Aufdeckfehler an der jeweiligen Stelle, die Auswahl bleibt erhalten;
axe-core ohne Befunde. Typecheck, Lint, Build fehlerfrei.
Offen: Fehlermeldungen nennen weiterhin „Supabase“ (technischer Begriff, aber nur im Fehlerfall).
