# 007 – Stimmen speichern und ändern

- **Status:** Offen
- **Abhängigkeiten:** 006
- **Meilenstein:** M2

## Ziel

Pro Identität genau eine gültige Stimme für die offene aktuelle Runde speichern.

## Aufgaben

- Datenbankfunktion zur Stimmabgabe mit Raum-/Runden-ID und Kartenwert implementieren.
- Nutzer-ID aus der Auth-Session ableiten, nicht aus frei übergebenen Parametern.
- Mitgliedschaft, aktuelle Runden-ID, offenen Status und Kartenwert prüfen.
- Bestehende eigene Stimme aktualisieren statt weitere Stimmen einzufügen.
- Stimmabgabe mit Aufdecken/Rundenwechsel über dieselbe Sperrstrategie koordinieren.
- Lesen aller Stimmen nur für Raum-Mitglieder erlauben; Werte werden bewusst bereits
  vor dem Aufdecken ausgeliefert und später durch die UI verborgen.
- Frontend-Zugriff mit typisierten Ergebnissen und fachlichen Fehlern ergänzen.

## Abnahmekriterien

- Eine zweite Auswahl ersetzt die erste; die Stimmenanzahl bleibt gleich.
- Stimmen für alte oder aufgedeckte Runden werden abgelehnt.
- Fremde Stimmen können nicht verändert werden, auch nicht durch direkte API-Aufrufe.
- Gleichzeitiges Aufdecken und Abstimmen hat ein konsistentes Ergebnis:
  Stimme vor Aufdecken angenommen oder nach Aufdecken abgewiesen.

## Prüfung und Ergebnis

Eigene Auswahl ändern, ungültige Werte senden und fremde Stimmänderungen manuell
versuchen. Mit zwei Sessions abstimmen. Kein Testcode ohne festgestellten Bug.
