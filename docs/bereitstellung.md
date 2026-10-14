# Veröffentlichung mit Cloudflare Pages und Supabase

Diese Anleitung bringt die App ins Internet (HTTPS, kostenlose `workers.dev`- bzw. `pages.dev`-Adresse). Du brauchst
zwei kostenlose Konten, die ihr selbst kontrolliert: **Supabase** und **Cloudflare**. Es ist keine
IT-Freigabe und kein eigener Server nötig.

Stand der Plattform-Angaben: Oktober 2026. Bezeichnungen im Dashboard können sich ändern.

## Überblick

```text
Browser ──► Cloudflare Pages (statische Dateien aus dist/)
   │
   └──────► Supabase (Datenbank, anonyme Anmeldung, Echtzeit)
```

Die Web-App enthält zur Laufzeit nur zwei **öffentliche** Werte: die Supabase-Projekt-URL und den
Publishable Key. Sie werden beim Bauen eingebettet (Variablen `VITE_SUPABASE_URL` und
`VITE_SUPABASE_PUBLISHABLE_KEY`). Niemals einen `secret`- oder `service_role`-Key verwenden.

## 1. Supabase vorbereiten

Alles Weitere steht in [`supabase-einrichtung.md`](supabase-einrichtung.md). Kurzfassung:

1. Projekt anlegen (Free-Plan).
2. Alle Migrationen aus `supabase/migrations/` **in der Reihenfolge der Dateinamen** im SQL Editor
   ausführen.
3. Anonyme Anmeldung aktivieren (Authentication → Sign In / Providers).
4. Project URL und Publishable Key notieren (Connect-Dialog).

## 2. Cloudflare Pages einrichten

Es gibt zwei Wege. Für beide brauchst du einen kostenlosen Cloudflare-Account.

### Weg A: Git-Anbindung (empfohlen, wenn ihr ein GitHub-Repository habt)

Vorteil: Jeder Push auf `main` veröffentlicht automatisch.

Cloudflare führt Pages und Workers zusammen. Das Dashboard zeigt je nach Konto den neueren
**Workers-Flow** (Feld „Deploy command“) oder den klassischen Pages-Flow. Das Repository ist für
beides vorbereitet: `wrangler.jsonc` beschreibt die Auslieferung als statische Single-Page-App.

**Workers-Flow (Feld „Deploy command“ sichtbar):**

1. Im Cloudflare-Dashboard: **Workers & Pages → Create application → Import a repository** (bzw.
   „Connect to Git“), das GitHub-Repository auswählen.
2. Einstellungen:

   | Einstellung      | Wert                                                              |
   | ---------------- | ----------------------------------------------------------------- |
   | Project name     | `planning-poker` (muss dem `name` in `wrangler.jsonc` entsprechen) |
   | Production branch | `main`                                                           |
   | Build command    | `npm run build`                                                   |
   | Deploy command   | `npx wrangler deploy` (Standardwert, nicht ändern)                |
   | Root directory   | leer lassen                                                       |

3. Variablen eintragen (siehe unten). Im Workers-Flow gehören sie zu den **Build-Variablen**
   („Build variables and secrets“), nicht zu den Laufzeit-Variablen: Sie werden beim Bauen in die
   App eingebettet.
4. **Save and Deploy**. Die App ist danach unter `https://planning-poker.<konto>.workers.dev`
   erreichbar.

**Klassischer Pages-Flow (kein Feld „Deploy command“):** Build command `npm run build`, Build
output directory `dist`, Variablen unter Settings → Environment variables. `wrangler.jsonc` wird
dann nicht gebraucht, stört aber nicht.

**Variablen (beide Flows, Production):**

| Variable                        | Wert                                         |
| ------------------------------- | -------------------------------------------- |
| `VITE_SUPABASE_URL`             | Project URL, z. B. `https://abc.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`)         |

Die Node-Version (22) wird aus der Datei `.nvmrc` gelesen. Setze sonst `NODE_VERSION=22`.
Änderungen an den Variablen wirken erst nach einem neuen Build.

### Weg B: Direkter Upload (ohne Git)

Nachteil: Ein Direct-Upload-Projekt lässt sich später **nicht** auf Git-Anbindung umstellen; dafür
müsstest du ein neues Projekt anlegen.

1. Lokal bauen (mit deiner `.env.local`, siehe `README.md`):

   ```bash
   npm ci
   npm run build
   ```

2. Per Kommandozeile: `npx wrangler login`, dann `npx wrangler deploy` (nutzt `wrangler.jsonc`).
   Im klassischen Pages-Flow alternativ per Drag and drop: **Workers & Pages → Create application →
   Pages → Upload assets**, den Ordner `dist/` hineinziehen.
3. Für jede Aktualisierung neu bauen und erneut hochladen.

### Routing und Header

- Direkte Aufrufe und Neuladen von Raum-Links (`/r/<token>`): Im Workers-Flow sorgt
  `not_found_handling: single-page-application` in `wrangler.jsonc` dafür, dass `index.html`
  ausgeliefert wird. Im klassischen Pages-Flow geschieht das automatisch, solange es keine
  `404.html` gibt. Lege deshalb **keine** `404.html` an.
- `public/_headers` setzt eine Content-Security-Policy und weitere Sicherheits-Header. Die Policy
  erlaubt Verbindungen zu `https://*.supabase.co` und `wss://*.supabase.co`. Verwendest du später
  eine eigene Domain für Supabase, passe `connect-src` an.

## 3. Prüfen nach der Veröffentlichung

1. Die veröffentlichte Adresse (`*.workers.dev` bzw. `*.pages.dev`) öffnen: Startseite erscheint (kein Einrichtungshinweis).
2. Raum erstellen, den Link in einem **zweiten Browserprofil oder Privatfenster** öffnen und
   beitreten.
3. Abstimmen, aufdecken, neue Runde: beide Fenster aktualisieren sich ohne Neuladen.
4. Den Raum-Link direkt in einem neuen Tab öffnen und die Seite neu laden.

Zeigt die Startseite „Einrichtung erforderlich“, fehlen die Variablen im Build (Weg A: Variablen
setzen und neu deployen; Weg B: lokal mit `.env.local` bauen).

## 4. Aktualisieren

Reihenfolge bei Änderungen, die die Datenbank betreffen:

1. **Zuerst die neue Migration** im Supabase SQL Editor ausführen. Migrationen sollen
   abwärtskompatibel sein, sodass die bisher veröffentlichte App kurz weiterläuft. Ob das bei einer
   konkreten Änderung gilt, muss beim Erstellen der Migration geprüft werden.
2. **Danach** das Frontend veröffentlichen (Push bzw. neuer Upload).

Bestehende Raum-Links bleiben gültig. Die Räume liegen in der Datenbank, nicht im Frontend.

## 5. Betrieb und Grenzen (Free-Pläne)

- **Pausierung:** Supabase kann Free-Projekte nach etwa **7 Tagen Inaktivität** pausieren. Dann
  zeigt die App eine Verbindungsmeldung. Im Supabase-Dashboard das Projekt **wiederherstellen**
  (Restore); Räume und Raum-Links sind danach wieder verfügbar. Ein Upgrade auf Pro verhindert das.
- **Anonyme Anmeldungen:** Limit **30 pro Stunde und IP-Adresse**. Jeder Browser meldet sich nur
  einmal an, danach bleibt die Sitzung. Hinter einer gemeinsamen Firmen-IP teilt sich das Team das
  Limit; bei Bedarf unter Authentication → Rate Limits anheben. Auch das Erneuern von Sitzungen
  (Token-Refresh) ist pro IP begrenzt (laut Doku 1800 pro Stunde).
- **Echtzeit:** Im Free-Plan sind laut Preisseite 200 gleichzeitige Verbindungen und 2 Millionen
  Nachrichten pro Monat enthalten. Das reicht für kleine Teams. Auslastung im Dashboard prüfen.
- **Cloudflare Pages Free:** 500 Builds pro Monat, bis zu 20 000 Dateien je Site (die App hat
  wenige). Keine eigene Domain nötig.
- **Backups:** Free-Projekte haben keine herunterladbaren Backups. Die Daten sind flüchtig (nur
  aktuelle Runden) und können jederzeit neu entstehen.
- **Netz:** Teilnehmende müssen `*.workers.dev` bzw. `*.pages.dev` und `*.supabase.co` (HTTPS und WebSocket) erreichen.
  Blockiert ein Netz WebSockets, fragt die App alle 5 Sekunden nach und bleibt nutzbar.

## 6. Aufräumen

Es gibt bewusst keine automatische Löschung: Räume bleiben dauerhaft. Wer manuell aufräumen will:

- **Räume löschen** (Mitglieder, Runde und Stimmen verschwinden mit): im SQL Editor
  `delete from public.rooms where id = '<raum-id>';`. Ungenutzte Räume lassen sich z. B. an
  `revision = 1` (nie benutzt) oder an `created_at` erkennen. Prüfe vorher, dass niemand den Link
  noch braucht.
- **Anonyme Nutzer** unter Authentication → Users nur löschen, wenn sie in keinem Raum Mitglied
  sind: Das Löschen eines Nutzers entfernt seine Mitgliedschaften und Stimmen **und die aktuelle
  Runde, falls er sie gestartet hat**. Eine pauschale Löschung „älter als X Tage“ kann aktive
  Teilnehmende treffen.

## 7. Dokumentation des Ist-Stands

Nach der ersten Veröffentlichung hier eintragen (nicht committen, falls nicht gewünscht):

| Angabe                       | Wert |
| ---------------------------- | ---- |
| App-URL                      |      |
| Supabase-Projekt (Referenz)  |      |
| Zuletzt angewendete Migration |      |
| Deploy-Weg (A oder B)        |      |
