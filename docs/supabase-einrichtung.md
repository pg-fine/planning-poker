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

1. `20261014090000_tabellen.sql`
2. `20261014090100_zugriffsrechte.sql`

Einfachster Weg: Im Dashboard den **SQL Editor** öffnen, den Inhalt der Datei einfügen und
ausführen, dann die nächste Datei. Wer die Supabase CLI nutzt, kann stattdessen
`supabase link` und `supabase db push` verwenden.

Danach sollte der **Table Editor** die Tabellen `rooms`, `room_invites`, `room_members`,
`rounds` und `votes` zeigen. Alle Tabellen haben aktivierte Row Level Security; der Browser
darf nur Daten von Räumen lesen, in denen die Person Mitglied ist, und nichts direkt schreiben.

## 3. Öffentliche Schlüssel

Unter **Project Settings → API** (bzw. **API Keys**) werden benötigt:

- die **Project URL** → `VITE_SUPABASE_URL`
- der **Publishable key** (früher `anon` key) → `VITE_SUPABASE_PUBLISHABLE_KEY`

Beides kommt in `.env.local` (siehe `README.md`). **Niemals** den `service_role`- oder
`secret`-Key im Frontend oder im Repository verwenden.

## 4. Anonyme Anmeldung aktivieren (Arbeitspaket 004)

Unter **Authentication → Sign In / Providers** die Option **Allow anonymous sign-ins**
aktivieren. Ohne sie können Teilnehmende nicht ohne Registrierung beitreten.

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
