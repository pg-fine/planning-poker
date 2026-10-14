# 013 – Cloud-Einrichtung und Veröffentlichung

- **Status:** Offen
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

Anleitung Schritt für Schritt nachvollziehen und veröffentlichten Build manuell
prüfen. Keine Testautomatisierung ohne Bugfund; keine geheimen Zugangsdaten dokumentieren.
