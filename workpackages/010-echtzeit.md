# 010 – Echtzeit-Synchronisierung

- **Status:** Offen
- **Abhängigkeiten:** 009
- **Meilenstein:** M3

## Ziel

Änderungen an Runde und Stimmen ohne manuelles Neuladen auf alle Raumansichten übertragen.

## Aufgaben

- Benötigte Tabellen gezielt in Supabase Realtime aufnehmen; Einrichtung als SQL bzw.
  nachvollziehbare Dashboard-Schritte festhalten.
- Subscriptions pro Raum registrieren und beim Wechsel/Verlassen aufräumen.
- Datenbank als maßgeblichen Zustand behandeln; Events lösen gebündeltes Nachladen aus.
- Auch Stimmenlöschungen und Rundenwechsel zuverlässig erkennen, beispielsweise
  über eine im selben Vorgang aktualisierte Raumrevision.
- Nach erfolgreichem Subscribe einen aktuellen Snapshot laden, damit zwischen
  Erstladen und Subscription keine Änderung verloren geht.
- Veraltete Antworten bei überlappenden Ladeanfragen ignorieren.
- Verbindungsstatus bereitstellen und unnötige Mehrfach-Subscriptions vermeiden.

## Abnahmekriterien

- Zwei Profile sehen Stimmenanzahl, Aufdecken und neue Runde ohne Reload.
- Beitritt während einer laufenden Runde zeigt deren vollständigen aktuellen Zustand.
- Verlassen und Raumwechsel lassen keine aktiven Listener des alten Raums zurück.
- Events und Nachladezugriffe geben keine Daten fremder Räume frei.

## Prüfung und Ergebnis

Parallel in zwei Profilen abstimmen, aufdecken und Raum wechseln. Requests und
Subscription-Lebenszyklus im Browser prüfen. Kein automatisierter Testcode ohne Bugfund.
