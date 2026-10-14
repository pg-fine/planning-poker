# 011 – Wiederverbinden und konkurrierende Aktionen

- **Status:** Offen
- **Abhängigkeiten:** 010
- **Meilenstein:** M4

## Ziel

Bei Netzproblemen und gleichzeitiger Bedienung einen nachvollziehbaren Zustand erhalten.

## Aufgaben

- Nach Reconnect sowie Rückkehr in einen länger inaktiven Tab aktuellen Zustand laden.
- Verbindungsverlust kenntlich machen und Mutationen bei bekannter Offline-Situation sperren.
- Fehlgeschlagene Aktionen nicht stillschweigend als erfolgreich anzeigen.
- Bei unklarer Antwort zuerst Zustand abgleichen; nicht blind neue Runden erneut erzeugen.
- Bei Versions-/Rundenkonflikten aktualisieren und verständlich zum erneuten Handeln auffordern.
- Mehrere Tabs derselben Identität als eine Stimme behandeln; gespeicherte Auswahl abgleichen.
- Mitgliedschaftsliste nicht als aktuelle Online-Liste oder Pflichtabstimmendenliste darstellen.
- Verbindungsabbruch erhält gespeicherte Stimmen; bewusstes Verlassen nutzt die
  Löschregeln aus 005 und aktualisiert andere Ansichten.

## Abnahmekriterien

- Offline/Online-Wechsel stellt den aktuellen Rundenzustand ohne manuelles Neuladen wieder her.
- Nach zwischenzeitlichem Rundenwechsel wird keine alte Auswahl in die neue Runde übertragen.
- Mehrere Tabs erzeugen keine Doppelstimmen.
- Zwei gleichzeitige neue Runden bzw. Aufdecken während Stimmabgabe führen zu
  konsistenten Anzeigen und nachvollziehbaren Konfliktmeldungen.

## Prüfung und Ergebnis

Browser-Netzwerkmodus und zwei Profile nutzen; Verbindungsabbruch vor/nach einer
Mutation manuell simulieren. Gefundene Bugs dokumentieren; nur dafür gegebenenfalls
gezielte Regressionstests schreiben.
