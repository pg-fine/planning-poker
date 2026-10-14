# 013 – Cloud-Einrichtung und Veröffentlichung

- **Status:** Vorbereitet; Veröffentlichung blockiert (Cloudflare-Account nötig)
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
- Der Produktions-Build wurde lokal mit einem Server geprüft, der Pages nachbildet (statische Dateien,
  `_headers`, Fallback auf `index.html`), gegen das echte Supabase-Projekt und in Chromium mit zwei
  Profilen: Raum erstellen, direkter Aufruf des Raum-Links, Beitritt, Live-Update über WebSocket
  unter der CSP, Abstimmen, Aufdecken, Neuladen auf `/r/<token>`, ungültiger Link, Favicon –
  ohne Konsolenfehler und ohne CSP-Verstöße. Typecheck, Lint und Build sind fehlerfrei.

Nicht geprüft (nur mit eurem Cloudflare-Account möglich): die echte Veröffentlichung unter `pages.dev`,
das Verhalten der Header auf Cloudflare selbst und das Setzen der Variablen im Pages-Dashboard.

Offen, bis veröffentlicht wurde: endgültige URL und Migrationsstand in Abschnitt 7 der Anleitung
eintragen.
