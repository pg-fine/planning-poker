# 014 – Gemeinsame MVP-Abnahme

- **Status:** Erledigt (vom Auftraggeber abgenommen)
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

**Abnahme am 14.10.2026** durch den Auftraggeber (Peter Gruszka) an der veröffentlichten App
https://planning-poker.peter-gruszka.workers.dev. Rückmeldung: „Die Software ist abgenommen.
Sieht super aus.“ Die Abnahme wurde mündlich im Chat erteilt; ein szenarienweises Protokoll der
manuellen Durchführung durch das Team liegt nicht vor. Auffälligkeiten wurden nicht gemeldet.

Eigene Prüfungen vor der Abnahme (Headless-Chromium über Playwright, getrennte Browserprofile,
echtes Supabase-Projekt, kein Testcode eingecheckt). Die Szenarien 1-12 sind damit wie folgt abgedeckt:

| Nr. | Szenario | Geprüft in |
| --- | --- | --- |
| 1 | Raum erstellen, Link teilen, beitreten | 008, 013 (veröffentlichte App) |
| 2 | Titel, Karten wählen und ändern | 009 |
| 3 | Fremde Werte verborgen, Stimmenzahl live | 009, 010, 013 |
| 4 | Aufdecken durch zweite Person, Ergebnis | 009, 010 |
| 5 | Neue Runde ersetzt Titel und Stimmen | 009, 010 |
| 6 | Raum-Link später erneut öffnen | 008, 013 (Neuladen auf `/r/<token>`) |
| 7 | Beitritt während der Runde, Neuladen, zweiter Tab | 010, 011 |
| 8 | Verbindung unterbrechen, Runde wechselt | 011 (Netzwerk-Emulation) |
| 9 | Gleichzeitige Aktionen | 006, 007 (SQL, 8 parallele Aufrufe), 011 |
| 10 | Verlassen und erneut beitreten | 005, 008 |
| 11 | Zweiter Raum bleibt getrennt | 003, 005, 010 (Fremde sehen nichts, keine Ereignisse) |
| 12 | Fremde Abfragen und Änderungen abgewiesen | 003, 004, 005-007 (öffentlicher Key, `permission denied`/`not_member`) |

Projektbefehle zum Stand der Abnahme: `npm run typecheck`, `npm run lint` und `npm run build`
sind fehlerfrei. Es gibt keinen Testcode, weil kein Bug aufgefallen ist, der einen Regressionstest
verlangt hätte. Der einzige auffällige Fehler (ein einmal ausgebliebenes Live-Update) ist in Paket 011
dokumentiert und mit einem Abgleich alle 30 Sekunden abgesichert; seine Ursache ist nicht bewiesen.

Bekannte Grenzen des MVP:

- Teilnahme ist an den Browser gebunden. Ein anderes Gerät oder gelöschte Browserdaten bedeuten
  eine neue Teilnahme; ein alter Eintrag bleibt als Mitglied stehen, blockiert aber nichts.
- Keine Historie, keine Ticket-Integration, keine Teams-App (bewusst nicht im MVP).
- Fremde Kartenwerte sind vor dem Aufdecken nur in der Oberfläche verborgen, technisch aber für
  Mitglieder abrufbar (bewusste Entscheidung).
- Supabase Free pausiert nach etwa einer Woche Inaktivität; Reaktivierung siehe `docs/bereitstellung.md`.
- Geprüft wurde nur Chromium; echter Screenreader und die Teams-Umgebung wurden nicht getestet.
