# 003 – Datenbankschema und Leserechte

- **Status:** Offen
- **Abhängigkeiten:** 002
- **Meilenstein:** M1

## Ziel

Versionierbare SQL-Migrationen für die aktuelle Runde und raumgebundene Daten erstellen.

## Aufgaben

- Ein Supabase-Free-Projekt durch den Nutzer anlegen lassen; erste Einrichtung dokumentieren.
- SQL-Migrationen im Repository für Räume, Mitgliedschaften, aktuelle Runden und Stimmen anlegen.
- Fremdschlüssel, eindeutige Schlüssel, Werteprüfungen und erforderliche Indizes definieren.
- Raumübergreifende Zuordnungen und Doppelstimmen durch Datenbankregeln verhindern.
- Row Level Security (RLS) für alle von der App erreichbaren Tabellen aktivieren.
- Lesen auf eigene Mitgliedschaften bzw. Räume mit eigener Mitgliedschaft begrenzen.
- Einladungstoken getrennt und nicht über normale Tabellenlesezugriffe zugänglich halten;
  nur benötigte Zugangsfunktionen dürfen darauf zugreifen.
- Schreibzugriff zunächst sperren; Freigaben erfolgen gezielt über folgende Pakete.
- Falls eine Membership-Hilfsfunktion nötig ist, rekursive RLS-Abfragen vermeiden und
  Funktionsrechte sowie einen festen `search_path` berücksichtigen.

## Abnahmekriterien

- Migrationen lassen sich auf einem leeren Supabase-Projekt in Reihenfolge anwenden.
- Unangemeldete Zugriffe und Zugriffe fremder Nutzer liefern keine Raumdaten.
- RLS-Rechte sind auch mit dem öffentlichen Client-Key wirksam.
- Constraints verhindern ungültige Karten und doppelte Stimmen derselben Identität.

## Prüfung und Ergebnis

Schema und Policies reviewen; ausgewählte Lesezugriffe manuell unter verschiedenen
Benutzerkontexten prüfen. Keine automatisierten SQL-Tests ohne festgestellten Bug.
