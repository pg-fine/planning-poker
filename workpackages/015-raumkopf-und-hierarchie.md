# 015 – Kompakter Raumkopf und klare Hierarchie

- **Status:** Erledigt
- **Abhängigkeiten:** 014
- **Meilenstein:** M6: UX-Iteration 1
- **Herkunft:** UX-Bewertung (Punkt 1), Priorität hoch, Aufwand klein bis mittel

## Ziel

Die aktuelle Schätzung steht im Mittelpunkt. Raumverwaltung und technische Hinweise treten
zurück, damit im schmalen Browserfenster neben Teams wenig gescrollt werden muss.

## Aufgaben

- Kompakte Kopfzeile: Raum, eigener Name, „Einladen“ (Link kopieren).
- Aktuelle Schätzung als zentraler Arbeitsbereich.
- Teilnehmende auf breiten Bildschirmen neben der Schätzung, auf schmalen darunter.
- Raum-Link-Verwaltung, Verlassen-Aktion und technische Hinweise (Browserkennung, Supabase)
  einklappen bzw. hinter „Hilfe“ verschieben.
- Verbindungstext im Normalbetrieb durch „● Live“ ersetzen; ausführliche Hinweise nur bei Problemen.
- Bestehende Bedienbarkeit aus 012 erhalten (Fokusführung, Text statt nur Farbe, Umbruch langer Texte).

## Abnahmekriterien

- Bei 320 px und 1280 px Breite sind Schätzung und Hauptaktion ohne Suchen erreichbar.
- Kein horizontales Scrollen; Tastaturbedienung und Fokus wie zuvor.
- Verbindungsprobleme bleiben deutlich erkennbar, nicht nur durch Farbe.
- Typecheck, Lint und Build fehlerfrei; manuelle Prüfung in Hell- und Dunkelmodus.

## Prüfung und Ergebnis

Änderungen:

- Kompakte Kopfzeile (`RoomView.tsx`): „Du bist als … dabei“, Verbindungsstatus „● Live“ und „Einladen“
  (kopiert den Link; bei gesperrter Zwischenablage klappt „Raum und Hilfe“ auf und markiert den Link).
- Zweispaltiges Layout ab 40 rem: Schätzung links, Mitglieder rechts; auf schmalen Fenstern untereinander.
- Einladungslink, Hinweis zum Verlassen und „Raum verlassen“ stehen eingeklappt unter „Raum und Hilfe“.
- Der Hinweis zu Browserkennung und Identität im Fußbereich ist hinter „Hilfe zu Browser und Teilnahme“
  eingeklappt.
- Verbindungsstatus: im Normalbetrieb nur „● Live“; „○ Verbindung wird hergestellt …“ bzw.
  „▲ Keine Live-Verbindung“ mit ausführlichem Hinweis in einem Hinweiskasten nur bei Problemen.
- Die Phasenlogik (Formular „Neue Runde“ nur wenn sinnvoll) folgt in 016.

Geprüft (Headless-Chromium über Playwright, echtes Supabase-Projekt, kein Testcode eingecheckt):
Raum erstellen, Runde starten, Karte wählen bei 1280 px (hell), 320 px (hell) und 1000 px (dunkel):
kein horizontales Scrollen, keine JavaScript-Fehler. axe-core (WCAG 2 A/AA, Best Practices) ohne
Befunde in Hell- und Dunkelmodus, auch mit aufgeklappten Hilfebereichen. Typecheck, Lint und Build
fehlerfrei. Der Offline-Hinweiskasten wurde nicht visuell geprüft.

Hinweis: Die Prüfungen haben einige Testräume im Supabase-Projekt angelegt.
