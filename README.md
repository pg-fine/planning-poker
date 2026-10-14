# Planning Poker

Browser-App zum gemeinsamen Schätzen, die parallel zu einer Teams-Besprechung genutzt
wird. Ein Raum-Link wird im Teams-Chat geteilt; alle Teilnehmenden öffnen ihn im Browser.

Geplanter Technologie-Stack: React, TypeScript und Vite für die Oberfläche,
Supabase (Free) für Datenbank, anonyme Anmeldung und Echtzeit, Cloudflare Pages (Free)
für das Hosting. Roadmap und Arbeitspakete stehen in [`workpackages/`](workpackages/README.md).

## Voraussetzungen

- Node.js 22.12 oder neuer (siehe `.nvmrc`)
- npm (liegt Node.js bei)

## Lokal starten

```bash
npm ci            # Abhängigkeiten exakt nach package-lock.json installieren
cp .env.example .env.local
npm run dev       # Entwicklungsserver, standardmäßig http://localhost:5173
```

Ohne Supabase-Konfiguration startet die App mit einem Einrichtungshinweis. Trage in
`.env.local` die Projekt-URL und den öffentlichen Publishable-/Anon-Key deines
Supabase-Projekts ein und starte den Entwicklungsserver neu:

| Variable                        | Bedeutung                                   |
| ------------------------------- | ------------------------------------------- |
| `VITE_SUPABASE_URL`             | Projekt-URL, z. B. `https://abc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Öffentlicher Publishable-/Anon-Key          |

Verwende im Frontend **niemals** einen Service-Role- oder Secret-Key. `.env.local` ist
über `.gitignore` von der Versionsverwaltung ausgeschlossen.

## Befehle

| Befehl              | Zweck                                                         |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Entwicklungsserver mit Hot Reload                             |
| `npm run typecheck` | TypeScript-Typprüfung (`tsc -b`)                              |
| `npm run lint`      | ESLint                                                        |
| `npm run build`     | Typprüfung und Produktionsbuild; statische Dateien in `dist/` |
| `npm run preview`   | Gebauten Stand lokal ansehen                                  |

## Projektstruktur

```text
src/
  main.tsx        Einstiegspunkt
  ui/             Oberfläche (React-Komponenten, Routing, Styles)
  domain/         Fachliche Regeln ohne Abhängigkeiten (Karten, Eingabeprüfung)
  supabase/       Supabase-Konfiguration, Anmeldung und Datenbankzugriff
supabase/
  migrations/     SQL-Migrationen (in Dateinamen-Reihenfolge anwenden)
public/           Statische Dateien (Favicon, Cloudflare-Header)
docs/             Vertrag, Identität, Supabase-Einrichtung, Bereitstellung
workpackages/     Roadmap und Arbeitspakete
```

## Veröffentlichen

Schritt-für-Schritt-Anleitung für Supabase und Cloudflare Pages (beide Free-Pläne):
[`docs/bereitstellung.md`](docs/bereitstellung.md).

## Qualitätssicherung

Testcode wird ausschließlich geschrieben, wenn ein konkreter Bug auffällt. Geprüft wird
durch Typecheck, Lint, Build und manuelle Funktionsprüfungen.
