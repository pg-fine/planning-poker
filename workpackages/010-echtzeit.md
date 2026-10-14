# 010 – Echtzeit-Synchronisierung

- **Status:** Erledigt
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

Umsetzung:

- `supabase/migrations/20261014090500_echtzeit.sql`: nimmt nur `public.rooms` in die Publikation
  `supabase_realtime` auf (idempotent). Die Tabelle enthält weder Namen noch Stimmen; die
  Leserichtlinie aus 003 (nur Mitglieder) gilt auch für Echtzeit-Ereignisse.
- `src/ui/useRoomState.ts`: abonniert UPDATE-Ereignisse der eigenen Raumzeile
  (`id=eq.<roomId>`, Kanalname mit Zufallsanteil). Jedes Ereignis und jedes (erneute)
  `SUBSCRIBED` lädt den Snapshot per `get_room_state` nach. Überlappende Anforderungen werden
  zusammengefasst, Zustände mit älterer Revision verworfen. Aufräumen über `removeChannel`.
- Verbindungsstatus (`connecting`, `live`, `offline`) wird in `RoomView` als Text angezeigt.
- Nutzt die bereits vorhandene Raumrevision: Austritte, Rundenwechsel und gelöschte Stimmen
  werden dadurch zuverlässig erkannt (löschende Ereignisse gibt es nicht).

Geprüft ohne die Migration (echtes Projekt, Headless-Chromium): Der Kanal verbindet sich und die
Anzeige zeigt „Live verbunden“, aber es kommen erwartungsgemäß keine Ereignisse an. Das bestätigt,
dass die Migration nötig ist.

Nach Anwenden der Migration im echten Projekt geprüft (drei Profile, kein Testcode eingecheckt):

- Beitritt, neue Runde, Stimmenzahl, Aufdecken, neue Runde (ohne alte Stimmen) und Austritt
  erscheinen bei den anderen ohne Neuladen. Bei Austritt sinken Mitglieder- und Stimmenzahl live.
- Später Beitritt während einer laufenden Runde zeigt den aktuellen Stand.
- Fremde Personen erhalten keine Ereignisse eines Raums, dem sie nicht angehören.
- Jeder geöffnete Kanal wird beim Verlassen des Raums wieder geschlossen (`phx_leave`).
- Fremde Kartenwerte erscheinen auch live nicht vor dem Aufdecken. Keine JavaScript-Fehler.
