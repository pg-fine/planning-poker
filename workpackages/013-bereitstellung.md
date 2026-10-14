# 013 – Cloud-Einrichtung und Veröffentlichung

- **Status:** Erledigt
- **Abhängigkeiten:** 012
- **Meilenstein:** M5
- **Externe Voraussetzung:** Vom Nutzer kontrollierte Supabase- und Cloudflare-Accounts

## Ziel

Die App auf den gewählten Free-Plänen veröffentlichen und die Einrichtung reproduzierbar machen.

## Aufgaben

- Bisherige Supabase-Einrichtung zu einer Schritt-für-Schritt-Anleitung zusammenführen:
  Projekt, Migrationen, anonyme Anmeldung, Rechte, Realtime und öffentliche Konfiguration.
- Aktuelle Free-Plan-Grenzen und Auth-Rate-Limits prüfen, insbesondere mehrere
  Erstanmeldungen hinter derselben Firmen-IP; notwendige Einstellungen dokumentieren.
- Cloudflare Pages mit Build-Befehl, Node-Version und Ausgabeverzeichnis `dist/` einrichten.
- Öffentliche Supabase-URL und Publishable-/Anon-Key als Build-Konfiguration hinterlegen;
  lokale `.env`-Dateien und geheime Schlüssel nicht einchecken.
- URL-Routing so konfigurieren, dass direkte Raum-Links und Reload auch auf Pages funktionieren.
- HTTPS-Veröffentlichung unter `pages.dev` durchführen und Ablauf im README erklären.
- Update-Reihenfolge dokumentieren: kompatible Datenbankmigration, dann Frontend;
  Wiederverwendung alter Raum-Links beachten.
- Betriebshinweise zu Free-Plan-Pausierung, Reaktivierung und Budget-/Kontingentanzeige ergänzen.
- Eine bewusste manuelle Bereinigung ungenutzter Daten beschreiben; keine automatische
  Raumlöschung und keine pauschale Löschung anonymer Identitäten mit aktiven Mitgliedschaften.

## Abnahmekriterien

- Veröffentlichte URL ist erreichbar; Raum-Link öffnet direkt die passende Ansicht.
- Erstellung, Beitritt und Echtzeit funktionieren auf der veröffentlichten App.
- Die Anleitung reicht zur Einrichtung eines neuen Projekts ohne nicht dokumentierte Schritte.
- Die endgültige URL und angewendeten Migrationsstände sind dokumentiert.
- Ohne Account-Zugriff bleibt die Veröffentlichung ausdrücklich offen/blockiert.

## Prüfung und Ergebnis

Vorbereitet und geprüft:

- `docs/bereitstellung.md`: vollständige Anleitung (Supabase, Cloudflare Pages per Git-Anbindung
  oder direktem Upload, Variablen, Node-Version über `.nvmrc`, Prüfung nach dem Veröffentlichen,
  Update-Reihenfolge, Betriebsgrenzen, manuelles Aufräumen). Plattformangaben wurden in der aktuellen
  Cloudflare- und Supabase-Dokumentation nachgelesen (u. a. SPA-Verhalten ohne `404.html`,
  Build-Einstellungen für Vite, Node 22, Limits für anonyme Anmeldungen: 30 pro Stunde und IP).
- `public/_headers`: Content-Security-Policy (nur eigene Skripte/Styles, Verbindungen zu
  `*.supabase.co` per HTTPS und WebSocket), `X-Frame-Options`, `Permissions-Policy`.
- `public/favicon.svg` und Verweis in `index.html`.
- `wrangler.jsonc` (Workers mit statischen Dateien, SPA-Fallback) und `wrangler` als Entwicklungsabhängigkeit,
  weil das Cloudflare-Dashboard im neueren Flow ein „Deploy command“ (`npx wrangler deploy`) verlangt.
  Lokal mit `wrangler dev` geprüft: `/r/<token>` liefert die App (200), die Sicherheits-Header greifen.
- Der Produktions-Build wurde lokal mit einem Server geprüft, der Pages nachbildet (statische Dateien,
  `_headers`, Fallback auf `index.html`), gegen das echte Supabase-Projekt und in Chromium mit zwei
  Profilen: Raum erstellen, direkter Aufruf des Raum-Links, Beitritt, Live-Update über WebSocket
  unter der CSP, Abstimmen, Aufdecken, Neuladen auf `/r/<token>`, ungültiger Link, Favicon –
  ohne Konsolenfehler und ohne CSP-Verstöße. Typecheck, Lint und Build sind fehlerfrei.

Veröffentlicht und geprüft (Cloudflare Workers mit statischen Dateien, Git-Anbindung, Branch `main`):

- Adresse: https://planning-poker.peter-gruszka.workers.dev
- Startseite und direkter Aufruf von `/r/<token>` liefern die App (200), Sicherheits-Header
  (CSP, `X-Frame-Options`, `Permissions-Policy`) sind aktiv.
- Mit zwei getrennten Browserprofilen auf der echten Adresse: Raum erstellen, Beitritt per Link,
  Live-Updates (Beitritt, Runde, Stimmenzahl, Ergebnis, neue Runde ohne alte Stimmen, Verlassen),
  verborgene Fremdkarten, Neuladen auf `/r/<token>`, keine Konsolenfehler oder CSP-Verstöße.
  Fünf Durchläufe: vier fehlerfrei, ein Live-Update blieb einmal aus (siehe Nachtrag in Paket 011,
  inzwischen zusätzlich abgesichert).
- Endgültige URL und Migrationsstand stehen in Abschnitt 7 von `docs/bereitstellung.md`.
