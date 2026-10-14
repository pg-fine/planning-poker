# Veröffentlichung mit Cloudflare Pages und Supabase

Diese Anleitung bringt die App ins Internet (HTTPS, kostenlose `pages.dev`-Adresse). Du brauchst
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

1. Das Repository zu GitHub pushen (privat oder öffentlich; es enthält keine Geheimnisse).
2. Im Cloudflare-Dashboard: **Workers & Pages → Create application → Pages → Import an existing
   Git repository** und das Repository auswählen.
3. Einstellungen:

   | Einstellung            | Wert            |
   | ---------------------- | --------------- |
   | Production branch      | `main`          |
   | Build command          | `npm run build` |
   | Build output directory | `dist`          |

4. Unter **Environment variables** (für Production) setzen:

   | Variable                        | Wert                                  |
   | ------------------------------- | ------------------------------------- |
   | `VITE_SUPABASE_URL`             | Project URL, z. B. `https://abc.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`)  |

   Die Node-Version (22) wird aus der Datei `.nvmrc` gelesen. Setze sonst `NODE_VERSION=22`.
5. **Save and Deploy**. Danach ist die App unter `https://<projektname>.pages.dev` erreichbar.

Änderungen an den Variablen wirken erst nach einem neuen Build (Deployments → Retry deployment).

### Weg B: Direkter Upload (ohne Git)

Nachteil: Ein Direct-Upload-Projekt lässt sich später **nicht** auf Git-Anbindung umstellen; dafür
müsstest du ein neues Projekt anlegen.

1. Lokal bauen (mit deiner `.env.local`, siehe `README.md`):

   ```bash
   npm ci
   npm run build
   ```

2. Im Dashboard: **Workers & Pages → Create application → Pages → Upload assets** (Drag and drop),
   Projektnamen vergeben, den Ordner `dist/` hineinziehen, **Deploy site**.
   Alternativ per Kommandozeile: `npx wrangler login`, dann `npx wrangler pages deploy dist`.
3. Für jede Aktualisierung neu bauen und erneut hochladen.

### Routing und Header

- Direkte Aufrufe und Neuladen von Raum-Links (`/r/<token>`) funktionieren ohne Zusatzkonfiguration:
  Pages liefert bei Projekten ohne `404.html` automatisch `index.html` aus (SPA-Verhalten).
  Lege deshalb **keine** `404.html` an.
- `public/_headers` setzt eine Content-Security-Policy und weitere Sicherheits-Header. Die Policy
  erlaubt Verbindungen zu `https://*.supabase.co` und `wss://*.supabase.co`. Verwendest du später
  eine eigene Domain für Supabase, passe `connect-src` an.

## 3. Prüfen nach der Veröffentlichung

1. `https://<projektname>.pages.dev` öffnen: Startseite erscheint (kein Einrichtungshinweis).
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
- **Netz:** Teilnehmende müssen `*.pages.dev` und `*.supabase.co` (HTTPS und WebSocket) erreichen.
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
