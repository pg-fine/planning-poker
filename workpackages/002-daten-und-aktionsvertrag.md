# 002 – Daten- und Aktionsvertrag

- **Status:** Erledigt
- **Abhängigkeiten:** Keine
- **Meilenstein:** M1

## Ziel

Kleine, eindeutige Verträge für UI und Datenbank festlegen, bevor beide auseinanderlaufen.

## Aufgaben

- Modell für Raum, Mitgliedschaft, aktuelle Runde und Stimme dokumentieren.
- Interne Raum-ID und geheimes Einladungstoken voneinander trennen.
- Eine frische Runden-ID pro Rundenwechsel vorsehen; alte Runden werden ersetzt.
- Zustände festlegen: noch keine Runde, Abstimmung offen, aufgedeckt.
- Für Erstellen, Beitreten, neue Runde, Aufdecken, Abstimmen und Verlassen
  Eingaben, Rückgaben und fachliche Fehler definieren.
- Einmalige Stimme je Runde und anonymer Nutzer-ID festlegen; doppelte Namen zulassen.
- Gleichzeitige Aktionen definieren: Mutationen tragen die erwartete Runden-ID;
  alte Aktionen werden abgewiesen, wiederholtes Aufdecken ist unschädlich.
- Titel- und Namenslängen festlegen; Leerwerte nach Trimmen ablehnen.
- Mitgliedschaft, Online-Präsenz und vorhandene Stimme getrennt behandeln.
- Verlassen festlegen: Mitgliedschaft entfernen, eigene aktuelle Stimme entfernen;
  erneuter Beitritt ist mit demselben Raum-Link möglich.

## Abnahmekriterien

- Ein kurzes Architektur-/Vertragsdokument enthält Zustandsübergänge und Beispiele.
- Für neue Runden, verspätete Stimmen und gleichzeitiges Aufdecken gibt es eindeutige Regeln.
- Kartenwerte inklusive `?` und `☕` sind als abgeschlossene Wertemenge definiert.
- Die aktuelle Runde bleibt bei Verbindungsabbrüchen erhalten; ein neuer Aufruf
  startet nicht automatisch eine neue Runde.

## Prüfung und Ergebnis

Ergebnis: [docs/daten-und-aktionsvertrag.md](../docs/daten-und-aktionsvertrag.md).

- Alle Abnahmekriterien sind dort abgedeckt: Zustandsübergänge (Abschnitt 3), Regeln für
  neue Runden, verspätete Stimmen und gleichzeitiges Aufdecken (Abschnitt 4 und 6),
  geschlossene Kartenmenge inklusive `?` und `coffee`/☕ (Abschnitt 2), Verhalten bei
  Verbindungsabbrüchen (Abschnitt 7).
- Der Vertrag wurde in Abschnitt 8 an einer Runde mit zwei Teilnehmenden durchgespielt,
  einschließlich zeitgleicher Aktionen, Aufdecken, Rundenwechsel und späterem Wiederaufruf.
- Offene Detailentscheidungen stehen in Abschnitt 9. Es wurde kein Code und kein Testcode erstellt.
