# Identität im Browser

Teilnehmende melden sich nicht an. Beim ersten Start meldet die App den Browser **anonym**
bei Supabase an (`signInAnonymously`). Die daraus entstehende Nutzer-ID (`auth.uid()`) ist
die Identität in allen Räumen. Der Anzeigename ist nur eine Beschriftung und kein Login.

## Verhalten

| Situation                                        | Ergebnis                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| Erster Start in einem Browser-Profil             | Neue anonyme Identität, Session im `localStorage`                     |
| Neuladen, Browser neu starten                    | Gleiche Identität (gespeicherte Session, Token wird erneuert)         |
| Zweiter Tab oder zweites Fenster, gleiches Profil | Gleiche Identität; eine Sperre verhindert zwei parallele Erstanmeldungen |
| Anderes Profil, anderer Browser, anderes Gerät   | Neue Identität, also eine neue Teilnahme                              |
| Browserdaten gelöscht, Privatfenster geschlossen | Neue Identität. Frühere Mitgliedschaft und Stimme gehören der alten ID |
| Session ungültig (Nutzer serverseitig gelöscht)  | Gespeicherte Session wird verworfen, es folgt eine neue Anmeldung     |
| Supabase nicht erreichbar                        | Fehlermeldung mit „Erneut versuchen“; bestehende Session bleibt erhalten |

Eine neue Identität im selben Raum erscheint als zusätzliches Mitglied. Der alte Eintrag
bleibt bestehen, solange niemand ihn verlässt; er blockiert aber keine Abstimmung, weil es
keine Pflichtabstimmenden gibt (siehe `daten-und-aktionsvertrag.md`).

## Fehlerarten der Anmeldung

| Art                  | Typische Ursache                                           | Meldung enthält Hinweis auf                   |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Konfiguration fehlt  | `.env.local` fehlt oder enthält Platzhalter                | Einrichtungshinweis (vor jeder Anmeldung)     |
| `anonymous_disabled` | „Allow anonymous sign-ins“ ist aus                         | Schalter im Supabase-Dashboard                |
| `rate_limited`       | Mehr als 30 Anmeldungen pro Stunde und IP                  | Warten bzw. Limit im Dashboard erhöhen        |
| `network`            | Offline, pausiertes Projekt, Firmennetz blockiert Supabase | Verbindung prüfen, Projekt reaktivieren       |
| `unknown`            | z. B. falscher Publishable Key                             | URL und Key prüfen                            |
