# 018 – Rückmeldungen nahe an der Aktion

- **Status:** Offen
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

Noch nicht bearbeitet.
