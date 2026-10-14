# 021 – Dauerhafte Räume wiederfinden

- **Status:** Offen
- **Abhängigkeiten:** 015
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 5), Priorität mittel, Aufwand mittel

## Ziel

Weniger unnötig neue Räume und weniger Suchen nach dem richtigen Teams-Link.

## Aufgaben

- Optionaler Raumname beim Erstellen, z. B. „Team Atlas – Refinement“ (Schema/Validierung prüfen).
- Startseite: „Zuletzt verwendete Räume“, lokal im Browser gespeichert (`src/ui/storage.ts`),
  mit Fehlertoleranz bei gesperrtem Speicher.
- „Name ändern“ im Raum.
- Eintrag entfernbar; keine personenbezogenen Daten über den Anzeigenamen hinaus speichern.

## Abnahmekriterien

- Zuletzt besuchte Räume erscheinen nach Neuladen und führen in den richtigen Raum.
- Ohne verfügbaren lokalen Speicher bleibt die Startseite funktionsfähig.
- Typecheck, Lint, Build; manuelle Prüfung.

## Prüfung und Ergebnis

Noch nicht bearbeitet.
