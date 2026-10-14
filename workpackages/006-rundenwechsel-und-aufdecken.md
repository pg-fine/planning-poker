# 006 – Rundenwechsel und Aufdecken

- **Status:** Offen
- **Abhängigkeiten:** 005
- **Meilenstein:** M2

## Ziel

Alle Mitglieder können eine Runde konsistent starten und manuell aufdecken.

## Aufgaben

- Datenbankfunktionen für neue Runde und Aufdecken bereitstellen.
- Mitgliedschaft und Titel serverseitig validieren.
- Bei neuer Runde eine frische Runden-ID erzeugen und alte Stimmen/Rundendaten entfernen.
- Austausch in einer Transaktion durchführen und konkurrierende Mutationen durch
  Sperren sowie Prüfung der erwarteten Runden-ID koordinieren.
- Aufdecken nur auf die erwartete aktuelle Runde anwenden; mehrfaches Aufdecken
  derselben Runde ohne weitere Zustandsänderung beantworten.
- Auch eine Runde ohne Stimmen darf manuell aufgedeckt werden.
- Fachliche Konflikte in strukturierte Fehler für die Oberfläche übersetzen.

## Abnahmekriterien

- Ein Rundenwechsel entfernt alte Stimmen vollständig und öffnet die neue Abstimmung.
- Zwei gleichzeitige Rundenwechsel mit gleicher erwarteter ID ersetzen nicht unbemerkt
  die gerade neu erzeugte Runde; nur einer wird akzeptiert.
- Ein verspätetes Aufdecken der vorherigen Runde deckt nicht die neue Runde auf.
- Alle Mitglieder haben dieselben Rechte, fremde Nutzer keine Steuerrechte.

## Prüfung und Ergebnis

Rundenstart und Aufdecken manuell durchführen, anschließend mit zwei Sessions fast
gleichzeitig auslösen. Datenbankzustand kontrollieren. Testcode nur nach Bugfund.
