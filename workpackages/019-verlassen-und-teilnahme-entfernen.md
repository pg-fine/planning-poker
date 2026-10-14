# 019 – „Zur Startseite“ und „Teilnahme entfernen“ trennen

- **Status:** Blockiert (Produktentscheidung des Auftraggebers nötig)
- **Abhängigkeiten:** 016
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 6), Priorität hoch, Aufwand mittel

## Ziel

Wer nach der Besprechung geht, verändert dadurch kein aufgedecktes Ergebnis.

## Entscheidung

Dies ändert eine bewusste Produktregel: Bisher entfernt „Raum verlassen“ auch die eigene Stimme,
selbst nach dem Aufdecken (siehe MVP-Abnahme, Szenario 10). Vor der Umsetzung muss der
Auftraggeber die neue Regel bestätigen.

## Aufgaben (nach Bestätigung)

- „Zur Startseite“ beendet nur die Ansicht, ohne Datenänderung.
- „Teilnahme entfernen“ als ausdrückliche, bestätigte Aktion mit Datenänderung.
- Aufgedeckte Ergebnisse bleiben bis zum nächsten Rundenstart stabil; Entfernen wirkt dann nur
  auf offene Runden (Anpassung in Migrationen/RPC prüfen).
- `docs/daten-und-aktionsvertrag.md` und `docs/identitaet.md` aktualisieren.
- Szenario 10 der Abnahme anpassen.

## Abnahmekriterien

- Verlassen nach dem Aufdecken ändert das Ergebnis nicht.
- „Teilnahme entfernen“ ist klar benannt und erfordert Bestätigung.
- Datenisolation und Rechte (003) bleiben erhalten; Schema-Änderung dokumentiert.

## Prüfung und Ergebnis

Noch nicht bearbeitet.
