# 008 – Raum erstellen und beitreten: Oberfläche

- **Status:** Erledigt
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

Umsetzung:

- Routing ohne Bibliothek (`src/ui/routing.ts`, `Link.tsx`): `/` Startseite, `/r/<token>`
  Raum-Link (64 Hex-Zeichen), ungültige Links und unbekannte Adressen mit Rückweg zur Startseite.
  Auf Cloudflare Pages müssen direkte Aufrufe von `/r/...` auf `index.html` fallen (Paket 013).
- `HomePage` (Raum erstellen), `RoomPage` (Beitrittsformular oder direkter Einstieg),
  `RoomView` (Link kopieren, Mitgliederliste, Raum verlassen), `NameField`.
- `src/ui/storage.ts` merkt Namen und Einladungstoken → Raum-ID dieses Browsers (nicht
  sensibel, Speicher darf fehlen). Ein gemerkter Raum ohne Mitgliedschaft (z. B. neue
  Identität) führt zurück zum Beitrittsformular statt zu einem Fehler.
- Doppelklick-Schutz auf allen Aktionen; Fehler deutsch über `describeRoomError`.

Im Browser geprüft (Headless-Chromium über Playwright außerhalb des Projekts, zwei getrennte
Browser-Profile, echtes Supabase-Projekt; kein Testcode eingecheckt):

- Raum erstellen (leerer Name → Fehler), Link `/r/<64 hex>` steht in der Adresszeile.
- Neuladen öffnet den Raum ohne erneuten Beitritt. Zweites Profil tritt per Link bei
  (Doppelklick unschädlich), beide sehen 2 Mitglieder.
- Ungültiger Link (`/r/zu-kurz`) und wohlgeformter, unbekannter Token zeigen die Meldung;
  „Zur Startseite“ funktioniert. Unbekannte Adresse zeigt „Seite nicht gefunden“.
- Link kopieren: ohne Berechtigung erscheint der Hinweis mit markiertem Link, mit Berechtigung
  steht der Link in der Zwischenablage.
- Verlassen führt zur Startseite; derselbe Link bleibt gültig, der Name ist vorbelegt;
  erneuter Beitritt klappt. Neue Identität mit gemerktem Raum führt zum Beitrittsformular.
- Schmale Ansicht (380 px) ohne horizontales Scrollen; keine JavaScript-Fehler.
- Typecheck, Lint und Build sind fehlerfrei.

Beim Prüfen entstanden einige Testräume und anonyme Testnutzer im Supabase-Projekt (ohne Bedeutung).
