# 004 – Supabase-Verbindung und Identität

- **Status:** Offen
- **Abhängigkeiten:** 001
- **Meilenstein:** M1

## Ziel

Teilnehmenden ohne Registrierung eine wiedererkennbare Browser-Identität geben.

## Aufgaben

- Supabase-Client mit Projekt-URL und öffentlichem Publishable-/Anon-Key konfigurieren.
- Aktivieren anonymer Anmeldung im Supabase-Projekt dokumentieren.
- Bestehende Session laden; nur bei fehlender Session anonym anmelden.
- Gleichzeitige Initialisierung innerhalb der App deduplizieren.
- Session-Wiederherstellung, Ladezustand und Auth-Fehler bereitstellen.
- Anzeigenamen als fachliche Eingabe behandeln, nicht als Authentifizierung.
- Verhalten bei gelöschten Browserdaten oder abgelaufener Session dokumentieren.

## Abnahmekriterien

- Beim ersten Einstieg entsteht ohne E-Mail/Passwort eine anonyme Identität.
- Neuladen nutzt die vorhandene Identität wieder.
- Zusätzliche Tabs mit bereits gespeicherter Session verwenden dieselbe Identität.
- Bei Auth-Fehlern bleibt eine verständliche Meldung mit erneutem Versuch sichtbar.
- Fehlende Konfiguration und nicht aktivierte anonyme Anmeldung sind unterscheidbar.

## Prüfung und Ergebnis

Erste Anmeldung, Reload und zweiten Tab manuell prüfen; anschließend ein getrenntes
Browser-Profil verwenden. Supabase-Projekt erforderlich. Kein vorsorglicher Testcode.
