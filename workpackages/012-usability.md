# 012 – Bedienbarkeit und Fehleranzeigen

- **Status:** Erledigt
- **Abhängigkeiten:** 011
- **Meilenstein:** M4

## Ziel

Den vorhandenen Ablauf im Meeting schnell verständlich und gut bedienbar machen.

## Aufgaben

- Deutsche Beschriftungen und Fehlermeldungen vereinheitlichen.
- Tastaturbedienung, sichtbaren Fokus und beschriftete Eingabefelder sicherstellen.
- Gewählte Karte und Verbindungsstatus zusätzlich zu Farben durch Text/Symbole kennzeichnen.
- Layout auf Desktop und schmalen Browserfenstern prüfen und anpassen.
- Lange Titel/Namen sowie leere Zustände ohne Layoutbruch darstellen.
- Laufende Aktionen, erfolgreiche Linkkopie und Fehler gut sichtbar rückmelden.
- Kurzen Hinweis ergänzen: derselbe Browser behält die Identität; neues Gerät oder
  gelöschte Browserdaten bedeuten eine neue Teilnahme.
- Fehler bei pausiertem/nicht erreichbarem Supabase-Projekt verständlich anzeigen,
  ohne eine unbekannte Ursache fälschlich sicher zu diagnostizieren.

## Abnahmekriterien

- Raumzugang und Schätzrunde sind vollständig per Tastatur bedienbar.
- Keine wesentliche Aktion ist nur durch Farbe oder Hover erkennbar.
- Schmale Fenster bleiben ohne horizontales Scrollen für Kernaktionen nutzbar.
- Fehler geben eine sinnvolle nächste Handlung an und löschen keine Benutzereingaben unnötig.

## Prüfung und Ergebnis

Änderungen:

- Laufende Aktionen deaktivieren Knöpfe nicht mehr (`aria-disabled`, Klicks werden ignoriert,
  Eingabefelder `readOnly`): Der Tastaturfokus bleibt erhalten. Echtes `disabled` gibt es nur ohne
  Netzwerk. Knöpfe zeigen „Wird gespeichert …“.
- Fokusführung: Nach Seitenwechsel (z. B. Raum erstellt) und beim ersten Anzeigen des Raums wandert
  der Fokus an den Anfang des Inhalts; nach dem Aufdecken auf das Ergebnis, sofern der Fokus
  sonst verloren wäre.
- Kontrast im Dunkelmodus: eigene Textfarbe auf dem Akzent (`--on-accent`), vorher kaum lesbar.
- Lange Wörter (Namen, Titel, Links) brechen um und sprengen das Layout nicht.
- Hinweis zur Identität im Fußbereich: Browser behält die Teilnahme; anderes Gerät/Browser oder
  gelöschte Browserdaten bedeuten eine neue Person.
- Netzwerkfehler nennen mögliche Ursachen (Internet, pausiertes Free-Projekt, Netzblockade), ohne
  eine davon als sicher zu behaupten.
- Bereits vorhanden: deutsche Beschriftungen und Fehlertexte, beschriftete Felder, Kartenwahl per
  Text „gewählt“ und `aria-pressed`, Verbindungsstatus als Text, Kopier-Rückmeldung als Text.

Im Browser geprüft (Headless-Chromium über Playwright, echtes Supabase-Projekt; kein Testcode
eingecheckt):

- Reine Tastaturbedienung: Name eintippen und mit Enter den Raum erstellen, Titel mit Enter, per
  Tab zu den Karten, Auswahl mit der Leertaste (Fokus bleibt auf der Karte), per Tab zu „Karten
  aufdecken“, Enter deckt auf (Fokus danach auf dem Ergebnis).
- Automatische Barrierefreiheitsprüfung (axe-core, WCAG 2 A/AA und Best Practices) ohne Befunde
  auf Startseite, offener Runde, Ergebnis, Fehlerzustand und im Dunkelmodus (inkl. Kontrast).
- Fehlerfall (Anfrage bricht ab): Meldung mit „erneut versuchen“, eingegebener Titel bleibt erhalten.
- 320 px Breite mit 40 Zeichen Name und 120 Zeichen Titel ohne Leerzeichen: kein horizontales
  Scrollen in offener Runde und Ergebnis. Keine JavaScript-Fehler. Typecheck, Lint, Build fehlerfrei.

Grenzen: Geprüft wurde nur Chromium. Ein echter Screenreader und die Teams-Browser-Umgebung
wurden nicht getestet. Axe findet nur einen Teil möglicher Barrieren.
