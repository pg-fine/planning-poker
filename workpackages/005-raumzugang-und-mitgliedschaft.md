# 005 – Raumzugang und Mitgliedschaft

- **Status:** Offen
- **Abhängigkeiten:** 003, 004
- **Meilenstein:** M2

## Ziel

Dauerhafte Räume über einen Einladungslink zugänglich machen und Zugriffe begrenzen.

## Aufgaben

- Datenbankfunktionen für Raum erstellen, mit Token beitreten und Raum verlassen implementieren.
- Kryptografisch zufälliges Einladungstoken mit mindestens 128 Bit Entropie erzeugen.
- Raum-Erstellung und erste Mitgliedschaft in einer Transaktion durchführen.
- Namen serverseitig validieren und Mitgliedschaft pro Nutzer/Raum eindeutig halten.
- Erneutes Beitreten idempotent gestalten und Namensänderung ermöglichen.
- Raum-Mitgliedern das Kopieren des bestehenden Links ermöglichen, ohne eine öffentliche
  Liste von Räumen oder Tokens anzubieten.
- Beim Verlassen Mitgliedschaft und eigene aktuelle Stimme atomar entfernen;
  Runde und Raum bleiben erhalten.
- Bei privilegierten SQL-Funktionen Authentifizierung und Berechtigung explizit prüfen,
  Ausführungsrechte begrenzen und einen festen `search_path` verwenden.
- Typisierte Frontend-Zugriffsfunktionen bereitstellen.

## Abnahmekriterien

- Ein Link führt wiederholt in denselben Raum; es gibt keine automatische Ablaufzeit.
- Ungültige Tokens erzeugen keine Mitgliedschaft und verraten keine fremden Raumdaten.
- Erneutes Beitreten derselben Identität erzeugt kein Duplikat.
- Nach Verlassen sind direkte Raumabfragen gesperrt; erneuter Beitritt per Link funktioniert.

## Prüfung und Ergebnis

Erstellen, Beitreten und Verlassen manuell mit zwei Identitäten ausführen.
Zugriff auf einen zweiten, nicht betretenen Raum prüfen. Ergebnisse festhalten;
Testcode nur bei konkret gefundenem Bug.
