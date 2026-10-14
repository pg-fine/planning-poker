# 012 – Bedienbarkeit und Fehleranzeigen

- **Status:** Offen
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

Manuelle Tastatur- und Layoutprüfung sowie Typecheck, Lint und Build.
Kein Testcode für reine Darstellungsänderungen, sofern kein konkreter Bug vorliegt.
