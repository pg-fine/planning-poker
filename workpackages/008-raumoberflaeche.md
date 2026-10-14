# 008 – Raum erstellen und beitreten: Oberfläche

- **Status:** Offen
- **Abhängigkeiten:** 005
- **Meilenstein:** M3

## Ziel

Den Raumzugang vollständig über die Browser-Oberfläche ermöglichen.

## Aufgaben

- Startseite mit Namenseingabe und Aktion „Raum erstellen“ bauen.
- URL-Konzept für Einladungslinks festlegen und Beitritt darüber implementieren.
- Namen im Browser vorbelegen, aber vor erstmaligem Beitritt bestätigen lassen.
- Raumansicht mit „Link kopieren“ und „Raum verlassen“ erstellen.
- Bei gesperrtem Clipboard einen manuell kopierbaren Link anzeigen.
- Leere/zu lange Namen, ungültige Links, Ladezustände und API-Fehler darstellen.
- Nach Reload eines bekannten Raums Mitgliedschaft und aktuelle Daten wiederherstellen.
- Double-Clicks während laufender Aktionen verhindern.

## Abnahmekriterien

- Eine Person kann einen Raum erstellen und dessen Link an eine zweite Person geben.
- Die zweite Person tritt mit einem eigenen Namen bei.
- Ungültige Links zeigen eine hilfreiche Meldung mit Rückweg zur Startseite.
- Verlassen führt zur Startseite, ohne den Raum-Link ungültig zu machen.
- Direkter Aufruf und Neuladen eines Einladungslinks funktionieren lokal.

## Prüfung und Ergebnis

Den vollständigen Raumzugang mit getrennten Browser-Profilen manuell durchspielen.
Typecheck, Lint und Build ausführen. Testcode nur nach Bugfund.
