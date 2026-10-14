# 001 – Projektgrundgerüst

- **Status:** Erledigt
- **Abhängigkeiten:** Keine
- **Meilenstein:** M1

## Ziel

Eine lokal startbare, statisch baubare React-/TypeScript-App als Basis schaffen.

## Aufgaben

- Vite mit React und TypeScript einrichten; eine unterstützte Node-Version festhalten.
- Paketmanager festlegen und Lockdatei einchecken.
- Verzeichnisse für Oberfläche, Fachlogik und Supabase-Zugriff anlegen, sobald benötigt.
- Deutsche Startansicht mit App-Namen und einfachem Seitenlayout erstellen.
- Befehle für Entwicklung, Typecheck, Lint und Produktionsbuild bereitstellen.
- `.gitignore` und `.env.example` mit Platzhaltern für Supabase-URL und öffentlichen Key anlegen.
- Lokalen Start und Build im Projekt-README beschreiben.

## Abnahmekriterien

- Installation anhand der Lockdatei und lokaler Start funktionieren.
- Typecheck, Lint und Build laufen erfolgreich; der Build erzeugt statische Dateien in `dist/`.
- Ohne Supabase-Konfiguration startet die App mit verständlichem Einrichtungshinweis.
- Kein Testframework und kein Testcode werden vorsorglich angelegt.

## Prüfung und Ergebnis

Geprüft mit Node.js 22.22.1 und npm 9.2.0 (Linux-Sandbox):

- `npm ci` aus frischem `node_modules`: erfolgreich, 0 Schwachstellen gemeldet.
- `npm run typecheck`, `npm run lint`, `npm run build`: jeweils fehlerfrei; der Build
  erzeugt `dist/` (HTML, CSS, JS).
- `npm run dev`: Entwicklungsserver antwortet mit HTTP 200.
- Startansicht ohne Supabase-Konfiguration (serverseitig gerendert): zeigt den
  deutschen Einrichtungshinweis mit den fehlenden Variablen. Die Konfigurationsprüfung
  unterscheidet fehlende, ungültige (`ftp://`, keine URL) und gültige Werte.

Nicht geprüft: Darstellung in einem echten Browser (in der Sandbox ist keiner
verfügbar) und der Zustand mit gültiger Supabase-Konfiguration im Browser. Bitte beim
ersten `npm run dev` kurz ansehen.

Entscheidungen:

- Paketmanager npm (Lockdatei `package-lock.json`), Node.js >= 22.12 (`.nvmrc`, `engines`).
- TypeScript 6.0 statt 7.x, weil `typescript-eslint` derzeit nur TypeScript < 6.1 unterstützt.
- Kein Testframework und kein Testcode angelegt.
