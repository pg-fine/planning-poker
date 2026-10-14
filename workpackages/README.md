# Roadmap: Planning-Poker-MVP

## Ziel und festgelegter Umfang

Eine deutschsprachige Browser-App begleitet eure Teams-Besprechung. Der Raum-Link
wird im Teams-Chat geteilt; die Teilnehmenden öffnen ihn im Browser.

- React, TypeScript und Vite für die Oberfläche.
- Cloudflare Pages Free für statisches Hosting mit einer `pages.dev`-Adresse.
- Supabase Free für PostgreSQL, anonyme Anmeldung und Echtzeit-Updates.
- Eigene Accounts und eigener Quellcode; kein selbst betriebener Backenddienst.
- Wiederverwendbare Raum-Links ohne automatische Raumlöschung.
- Teilnahme mit Anzeigename, ohne sichtbare Registrierung.
- Karten: `0`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `?`, `☕`.
- Stimmen werden sofort gespeichert, bis zum Aufdecken nur in der UI verborgen.
  Das ist eine bewusste Fairness-Vereinbarung, keine technische Geheimhaltung.
- Alle Raum-Mitglieder dürfen aufdecken und neue Runden starten.
- Jede Person ändert ausschließlich ihre eigene Stimme, solange die Runde offen ist.
- Nur die aktuelle Runde bleibt gespeichert; eine neue Runde ersetzt Titel und Stimmen.
- Teams-Integration, automatische Teams-Identität, Historie und Ticket-Integrationen
  gehören nicht zum MVP.

## Arbeitsweise und Qualität

**Testcode wird ausschließlich geschrieben, wenn ein konkreter Bug auffällt.**
Kein vorsorgliches Testframework, keine automatisch erzeugten Tests und kein TDD
für neue Funktionen. Ein gefundener Bug wird mit Reproduktion, erwartetem und
tatsächlichem Verhalten dokumentiert. Ein gezielter Regressionstest darf dann
ergänzt werden, wenn er zur Absicherung der Korrektur sinnvoll ist.

Die Abnahme erfolgt ansonsten durch Code-/SQL-Review, Typecheck, Lint, Build und
manuelle Funktionsprüfungen. Prüfungen mit mehreren Personen verwenden getrennte
Browser-Profile; zwei Tabs desselben Profils teilen normalerweise eine Identität.

Jedes Paket ist ein kleiner, fachlich zusammenhängender Schritt. Es soll einzeln
reviewbar und commitbar sein. Abhängigkeiten müssen vor Abschluss erfüllt sein.
Status und tatsächliche Prüfergebnisse werden bei der Umsetzung im Paket ergänzt.
Externe Voraussetzungen werden als Blocker dokumentiert, nicht als erledigt markiert.

## Meilensteine und Arbeitspakete

Der Status (Offen, In Arbeit, Erledigt, Blockiert) wird hier und im jeweiligen Paket gepflegt. Die Nummerierung ist die empfohlene
Bearbeitungsreihenfolge; die Spalte Abhängigkeiten nennt die zwingenden Vorarbeiten.

| Nr. | Arbeitspaket | Abhängigkeiten | Meilenstein | Status |
| --- | --- | --- | --- | --- |
| 001 | [Projektgrundgerüst](001-projektgrundgeruest.md) | – | M1: Grundlage | Erledigt |
| 002 | [Daten- und Aktionsvertrag](002-daten-und-aktionsvertrag.md) | – | M1 | Erledigt |
| 003 | [Datenbankschema und Leserechte](003-datenbankschema-und-leserechte.md) | 002 | M1 | Erledigt |
| 004 | [Supabase-Verbindung und Identität](004-supabase-und-identitaet.md) | 001 | M1 | Erledigt |
| 005 | [Raumzugang und Mitgliedschaft](005-raumzugang-und-mitgliedschaft.md) | 003, 004 | M2: Gemeinsamer Raum | Erledigt |
| 006 | [Rundenwechsel und Aufdecken](006-rundenwechsel-und-aufdecken.md) | 005 | M2 | Erledigt |
| 007 | [Stimmen speichern und ändern](007-stimmen-speichern.md) | 006 | M2 | Erledigt |
| 008 | [Raum erstellen und beitreten: Oberfläche](008-raumoberflaeche.md) | 005 | M3: Spielbarer Ablauf | Erledigt |
| 009 | [Karten und Ergebnisse: Oberfläche](009-pokeroberflaeche.md) | 006, 007, 008 | M3 | Erledigt |
| 010 | [Echtzeit-Synchronisierung](010-echtzeit.md) | 009 | M3 | Erledigt |
| 011 | [Wiederverbinden und konkurrierende Aktionen](011-wiederverbinden-und-konflikte.md) | 010 | M4: Verlässliche Nutzung | Erledigt |
| 012 | [Bedienbarkeit und Fehleranzeigen](012-bedienbarkeit.md) | 011 | M4 | Erledigt |
| 013 | [Cloud-Einrichtung und Veröffentlichung](013-bereitstellung.md) | 012 | M5: Nutzbares MVP | Erledigt |
| 014 | [Gemeinsame MVP-Abnahme](014-mvp-abnahme.md) | 013 | M5 | Erledigt |
| 015 | [Kompakter Raumkopf und Hierarchie](015-raumkopf-und-hierarchie.md) | 014 | M6: UX-Iteration 1 | Erledigt |
| 016 | [Phasen und „Noch einmal schätzen“](016-phasen-und-neue-runde.md) | 015 | M6 | Erledigt |
| 017 | [Ergebnisverteilung und Ergebnistexte](017-ergebnisdarstellung.md) | 015 | M6 | Offen |
| 018 | [Rückmeldungen nahe an der Aktion](018-lokale-rueckmeldungen.md) | 015 | M6 | Offen |
| 019 | [Verlassen und Teilnahme entfernen](019-verlassen-und-teilnahme-entfernen.md) | 016 | M7: UX-Iteration 2 | Blockiert |
| 020 | [Teilnehmerstatus](020-teilnehmerstatus.md) | 016 | M7 | Blockiert |
| 021 | [Dauerhafte Räume wiederfinden](021-raeume-wiederfinden.md) | 015 | M7 | Offen |

### M1: Grundlage

Die App baut erfolgreich; Datenmodell und Zugriffsmodell sind definiert und die
anonyme Anmeldung funktioniert. Für echte Datenbank-/Auth-Prüfungen wird bereits
ein Supabase-Free-Projekt benötigt. Dessen erste Einrichtung wird in 003 und 004
festgehalten und später in 013 zu einer vollständigen Anleitung zusammengeführt.

### M2: Gemeinsamer Raum

Raumzugang, Rundenwechsel und Abstimmungen funktionieren über die Datenbank-API.
Raumfremde Zugriffe sind ausgeschlossen, konkurrierende Aktionen sind definiert.

### M3: Spielbarer Ablauf

Zwei Personen können über die Oberfläche beitreten, abstimmen, live Änderungen
sehen, aufdecken und eine neue Runde beginnen.

### M4: Verlässliche Nutzung

Neuladen, Verbindungsabbrüche und mehrere Tabs erzeugen keine Doppelstimmen oder
unbemerkten Zustandsverluste. Die App ist auf Desktop und schmalen Ansichten nutzbar.

### M5: Nutzbares MVP

Die App ist über HTTPS erreichbar, mit zwei getrennten Identitäten abgenommen und
anhand der Anleitung aus dem Repository erneut bereitstellbar.

### M6: UX-Iteration 1

Eine Person erkennt im Meeting innerhalb weniger Sekunden: welche Story geschätzt wird, welche
Karte sie gewählt hat und was der nächste Schritt ist. Grundlage ist eine heuristische
UX-Bewertung; echtes Nutzerverhalten sollte zusätzlich beobachtet werden.

### M7: UX-Iteration 2

Teilnehmerstatus, stabile Ergebnisse beim Verlassen und wiederauffindbare Räume. 019 und 020
benötigen vorab Produktentscheidungen.

## Voraussetzungen und Betriebsgrenzen

- Die Projektkonten werden vom Nutzer bzw. Team angelegt und kontrolliert.
- Im Frontend stehen nur Supabase-Projekt-URL und Publishable-/Anon-Key.
  Service-Role-/Secret-Keys und Account-Zugangsdaten gehören weder ins Frontend noch ins Git.
- Teilnehmende müssen die Webseiten von Cloudflare Pages und Supabase erreichen können.
- Supabase Free kann nach einer Woche Inaktivität pausieren. Ein dauerhaft gültiger
  Raum-Link garantiert daher keine ununterbrochene Verfügbarkeit; Wiederaufnahme
  im Dashboard gehört zur Betriebsanleitung.
- Freikontingente und aktuelle Plattformanforderungen werden bei Einrichtung geprüft.
- Anonyme Identität bleibt im Browser gespeichert. Ein anderes Profil/Gerät oder
  gelöschte Browserdaten erzeugen eine neue Identität; Namen sind kein Login.
- Persistente Räume und Mitgliedschaften werden nicht mit flüchtiger Online-Präsenz
  gleichgesetzt. Frühere Teilnehmende dürfen die neue Runde nicht als fehlende Stimmen blockieren.

## Quellen

- [Cloudflare Pages: Limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Supabase: Free-Plan](https://supabase.com/pricing)
- [Supabase: anonyme Anmeldung](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
