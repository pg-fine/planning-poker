# 011 – Wiederverbinden und konkurrierende Aktionen

- **Status:** Erledigt
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

Umsetzung:

- `useRoomState`: lädt den Stand zusätzlich bei „Netzwerk wieder da“ (`online`) und bei Rückkehr
  in den Tab (`visibilitychange`). Der Browser-Netzwerkstatus fließt in die Verbindungsanzeige ein.
  Ohne Live-Kanal (z. B. WebSockets im Firmennetz blockiert) fragt die App alle 5 Sekunden nach,
  solange der Tab sichtbar ist.
- `RoundPanel`: Aktionen sind nur bei fehlendem Netzwerk gesperrt, nicht schon bei ausgefallenem
  Live-Kanal. Bei unklarer Antwort (Verbindungsabbruch) wird nie blind wiederholt: Es wird der Stand
  geladen und geprüft, ob die Aktion dort sichtbar ist (Stimme, neue Runde mit diesem Titel,
  aufgedeckt). Wenn ja, gilt sie als erfolgreich, sonst erscheint eine klare Meldung.
- `RoomView`: Statustexte für „live“, „keine Live-Verbindung (Abfrage-Modus)“ und „keine Verbindung“
  (Aktionen pausiert, gespeicherte Stimme bleibt erhalten).
- Konfliktmeldungen (`round_conflict`, `round_not_open`) laden den Stand nach, wie in 009.
- Mehrere Tabs: die gewählte Karte stammt immer aus dem gespeicherten Stand, nie aus lokalem
  Gedächtnis. Dadurch wandert keine alte Auswahl in eine neue Runde.

Im Browser geprüft (Headless-Chromium über Playwright, mehrere Profile, echtes Supabase-Projekt;
kein Testcode eingecheckt):

- Netzwerk aus: Hinweis erscheint, Karten und Aufdecken gesperrt, gespeicherte Auswahl bleibt
  sichtbar. Währenddessen deckt eine andere Person auf und startet eine neue Runde; nach Netzwerk
  an erscheint die neue Runde ohne Neuladen und ohne die alte Auswahl.
- Stimme, neue Runde und Aufdecken mit verlorener Antwort (Anfrage kam an): kein Fehler, korrekter
  Zustand, bei der neuen Runde keine zweite Runde und geleerte Eingabe.
- Anfrage kam nicht an: Meldung „nicht angekommen“, bisherige Stimme bleibt.
- Zwei Tabs derselben Identität: Auswahl wird live übernommen und ersetzt sich gegenseitig,
  Stimmenzahl 1, Mitglieder unverändert.
- WebSocket blockiert: Hinweis „Keine Live-Verbindung“, Aktionen bleiben nutzbar, Änderungen
  erscheinen nach etwa 5 Sekunden, Abstimmen funktioniert.
- Keine JavaScript-Fehler. Typecheck, Lint und Build sind fehlerfrei.

Nicht geprüft: Rückkehr in einen im Hintergrund schlafenden Tab (nur per Code abgesichert) und
echte Verbindungsabbrüche mitten im Echtzeit-Kanal (nur über Netzwerk-Emulation).
