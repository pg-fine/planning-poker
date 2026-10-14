# Supabase einrichten

Diese Anleitung beschreibt die einmalige Einrichtung des Supabase-Projekts. Sie wächst mit
den Arbeitspaketen (003 Schema, 004 Anmeldung, 005–007 Funktionen, 010 Echtzeit) und wird in
Arbeitspaket 013 zur vollständigen Anleitung zusammengeführt. Bezeichnungen im Dashboard
können sich ändern; die Namen unten sind sinngemäß.

## 1. Projekt anlegen

1. Account auf <https://supabase.com> anlegen und eine Organisation mit dem **Free**-Plan wählen.
2. **New project** wählen, Namen vergeben (z. B. `planning-poker`), eine Region in der Nähe
   (z. B. Frankfurt) und ein starkes Datenbankpasswort wählen. Das Passwort wird für die App
   nicht benötigt; sicher aufbewahren, nicht im Repository speichern.
3. Warten, bis das Projekt bereit ist.

Hinweis: Free-Projekte werden nach etwa einer Woche Inaktivität pausiert und lassen sich im
Dashboard wieder aktivieren.

## 2. Datenbankschema anwenden

Die Migrationen liegen unter `supabase/migrations/`. Sie müssen **in der Reihenfolge der
Dateinamen** auf eine leere Datenbank angewendet werden:

1. `20261014090000_tables.sql`
2. `20261014090100_access_rights.sql`
3. `20261014090200_room_access.sql`
4. `20261014090300_rounds.sql`
5. `20261014090400_votes.sql`
6. `20261014090500_realtime.sql` (nimmt die Tabelle `rooms` in die Echtzeit-Veröffentlichung auf)
7. `20261014090600_stable_results.sql` (Arbeitspaket 019: aufgedeckte Ergebnisse bleiben nach
   „Teilnahme entfernen“ stehen)
8. `20261014090700_room_name.sql` (Arbeitspaket 022: optionaler Raumname)

Bei einer **bereits eingerichteten** Datenbank genügt es, nur die neuen Dateien (7 und 8) in dieser
Reihenfolge auszuführen. Die App läuft auch vor dem Anwenden weiter; ohne Migration 7 verschwindet
die Stimme beim Entfernen der Teilnahme wie bisher, ohne Migration 8 gibt es keine Raumnamen
(das Eingabefeld erzeugt dann einen Fehler).

Einfachster Weg: Im Dashboard den **SQL Editor** öffnen, den Inhalt der Datei einfügen und
ausführen, dann die nächste Datei. Wer die Supabase CLI nutzt, kann stattdessen
`supabase link` und `supabase db push` verwenden.

Danach sollte der **Table Editor** die Tabellen `rooms`, `room_invites`, `room_members`,
`rounds` und `votes` zeigen. Alle Tabellen haben aktivierte Row Level Security; der Browser
darf nur Daten von Räumen lesen, in denen die Person Mitglied ist, und nichts direkt schreiben.

## 3. Öffentliche Schlüssel

Benötigt werden:

- die **Project URL** (`https://<project-ref>.supabase.co`) → `VITE_SUPABASE_URL`
- der **Publishable key** (beginnt mit `sb_publishable_`) → `VITE_SUPABASE_PUBLISHABLE_KEY`

So findest du beides:

1. Im Dashboard das Projekt öffnen und oben auf **Connect** klicken. Der Dialog zeigt URL
   und Publishable key zum Kopieren.
2. Alternativ unter **Project Settings → API Keys**. Falls dort noch kein Publishable key
   steht, dort einen neuen erzeugen.

Der ältere `anon`-Key (langer Schlüssel, beginnt mit `eyJ`) funktioniert noch, wird aber bis
Ende 2026 abgeschafft; bitte den Publishable key verwenden. Beides kommt in `.env.local`
(siehe `README.md`). **Niemals** den `service_role`- oder `secret`-Key (`sb_secret_…`) im
Frontend oder im Repository verwenden.

## 4. Anonyme Anmeldung aktivieren (Arbeitspaket 004)

Unter **Authentication → Sign In / Providers** die Option **Allow anonymous sign-ins**
aktivieren und speichern. Ohne sie können Teilnehmende nicht ohne Registrierung beitreten.
Die Anmeldung braucht weder Schlüssel noch Anbieter-Registrierung. Anonyme Nutzer erscheinen
danach unter **Authentication → Users** als „anonymous“.

Hinweise:

- Supabase begrenzt anonyme Anmeldungen auf **30 pro Stunde und IP-Adresse**. Hinter einer
  gemeinsamen Firmen-IP teilt sich das Team dieses Limit. Jeder Browser meldet sich nur einmal
  an, danach bleibt die Sitzung erhalten. Bei Bedarf lässt sich das Limit unter
  **Authentication → Rate Limits** erhöhen.
- Supabase empfiehlt ein CAPTCHA gegen Missbrauch. Im MVP verzichten wir darauf: Raum-Links
  sind nicht öffentlich, und eine anonyme Anmeldung allein gewährt keinen Zugriff auf Raumdaten.
- Anonyme Nutzer nutzen die Rolle `authenticated`. Die Zugriffsrechte aus Arbeitspaket 003
  stützen sich deshalb auf die Raum-Mitgliedschaft und nicht auf die Rolle.

## 5. Schnellprüfung der Zugriffsrechte (optional)

Im **SQL Editor** lässt sich prüfen, dass eine nicht angemeldete Rolle nichts sieht. Die
Abfrage muss einen Fehler `permission denied for table rooms` liefern:

```sql
begin;
set local role anon;
select count(*) from public.rooms;
rollback;
```

Für `authenticated` ohne Mitgliedschaft muss die Abfrage dagegen `0` ergeben:

```sql
begin;
set local role authenticated;
select count(*) from public.rooms;
rollback;
```
