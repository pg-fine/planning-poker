# 014 – Gemeinsame MVP-Abnahme

- **Status:** Offen
- **Abhängigkeiten:** 013
- **Meilenstein:** M5
- **Externe Voraussetzung:** Zwei getrennte Browser-Identitäten, möglichst zwei Personen

## Ziel

Das veröffentlichte MVP in einem realistischen Planning-Poker-Ablauf abnehmen.

## Manuelle Abnahmeszenarien

1. Raum erstellen, Link im Teams-Chat teilen und mit zweitem Namen beitreten.
2. Story-Titel eingeben; unterschiedliche Karten wählen und eigene Auswahl ändern.
3. Vor Aufdecken bleiben fremde Werte verborgen; die Stimmenanzahl ist live korrekt.
4. Durch die zweite Person aufdecken; Namen, Zahlenwerte und Sonderkarten erscheinen korrekt.
5. Neue Runde starten; vorheriger Titel und Stimmen sind ersetzt, keine Historie ist abrufbar.
6. Alle Browser schließen und denselben Raum-Link später öffnen; Raum und aktuelle Runde bleiben.
7. Während einer Runde beitreten, neu laden und ein zusätzliches Fenster derselben Identität öffnen.
8. Verbindung unterbrechen, in der anderen Session die Runde wechseln und wieder verbinden.
9. Fast gleichzeitig neue Runde/Aufdecken/Stimmabgabe auslösen; Zustände bleiben konsistent.
10. Bewusst verlassen und per Link erneut beitreten; eigene entfernte Stimme bleibt entfernt.
11. Zweiten Raum erstellen; weder dessen Daten noch Änderungen erscheinen im ersten Raum.
12. Fremde Raumabfragen und Änderungen fremder Stimmen manuell über den Client versuchen;
    sie müssen abgewiesen werden. Kein Service-Role-Key für diese Prüfung verwenden.

## Aufgaben

- Typecheck, Lint und Produktionsbuild mit den endgültigen Ständen ausführen.
- Datum, Browser, beteiligte Profile, Build-/Commit-Stand und Ergebnisse protokollieren.
- Bugs mit Reproduktion und erwartetem/tatsächlichem Verhalten erfassen und korrigieren.
- **Testcode ausschließlich für konkret aufgefallene Bugs schreiben**, wenn ein gezielter
  Regressionstest sinnvoll ist; keine nachträgliche pauschale Testsuite erstellen.
- Nach Korrekturen betroffene Szenarien erneut prüfen.
- Kurze Nutzungsanleitung für Raum-Link, Kartenwahl, Aufdecken und neue Runde abschließen.

## Abnahmekriterien

- Alle Szenarien sind erfolgreich protokolliert; offene Punkte sind sichtbar dokumentiert.
- Keine offenen Fehler verhindern Raumzugang, Stimmabgabe, Aufdecken oder Datenisolation.
- Projektbefehle sind erfolgreich; gegebenenfalls vorhandene Bug-Regressionstests ebenfalls.
- Das Team kann mit Anleitung eine vollständige Schätzrunde ohne Entwicklerwerkzeuge durchführen.

## Prüfung und Ergebnis

Dieses Paket ist die manuelle Endabnahme. Ergebnisse erst nach tatsächlicher
Durchführung ergänzen; eine vorbereitete Checkliste gilt nicht als bestandene Prüfung.
