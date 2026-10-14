# 019 – „Zur Startseite“ und „Teilnahme entfernen“ trennen

- **Status:** Erledigt
- **Abhängigkeiten:** 016
- **Meilenstein:** M7: UX-Iteration 2
- **Herkunft:** UX-Bewertung (Punkt 6), Priorität hoch, Aufwand mittel

## Ziel

Wer nach der Besprechung geht, verändert dadurch kein aufgedecktes Ergebnis.

## Entscheidung

Dies ändert eine bewusste Produktregel: Bisher entfernt „Raum verlassen“ auch die eigene Stimme,
selbst nach dem Aufdecken (siehe MVP-Abnahme, Szenario 10). Vor der Umsetzung muss der
Auftraggeber die neue Regel bestätigen.

## Aufgaben (nach Bestätigung)

- „Zur Startseite“ beendet nur die Ansicht, ohne Datenänderung.
- „Teilnahme entfernen“ als ausdrückliche, bestätigte Aktion mit Datenänderung.
- Aufgedeckte Ergebnisse bleiben bis zum nächsten Rundenstart stabil; Entfernen wirkt dann nur
  auf offene Runden (Anpassung in Migrationen/RPC prüfen).
- `docs/daten-und-aktionsvertrag.md` und `docs/identitaet.md` aktualisieren.
- Szenario 10 der Abnahme anpassen.

## Abnahmekriterien

- Verlassen nach dem Aufdecken ändert das Ergebnis nicht.
- „Teilnahme entfernen“ ist klar benannt und erfordert Bestätigung.
- Datenisolation und Rechte (003) bleiben erhalten; Schema-Änderung dokumentiert.

## Prüfung und Ergebnis

Umgesetzt (ohne Datenbankänderung):

- „Zur Startseite“ (Link in der Raumkopfzeile) verlässt nur die Ansicht; Mitgliedschaft und Stimme
  bleiben, der Raum steht weiter in „Zuletzt verwendete Räume“.
- „Teilnahme entfernen“ (unter „Raum und Hilfe“) ruft wie bisher `leave_room` auf, jetzt mit
  Bestätigung („Teilnahme wirklich entfernen? Deine Stimme wird gelöscht.“) und mit Hinweis, dass die
  Stimme auch aus einem aufgedeckten Ergebnis verschwindet.
- `docs/daten-und-aktionsvertrag.md` ergänzt.

Geprüft (Headless-Chromium über Playwright, zwei getrennte Profile, echtes Supabase-Projekt): Startseite
lässt Stimme und Mitgliedschaft unverändert (zweite Person sieht 1 Stimme, 2 Mitglieder); Rückkehr
über die Liste zeigt die gespeicherte Stimme; Abbrechen belässt alles; „Ja, entfernen“ führt zur
Startseite, die zweite Person sieht 1 Mitglied und 0 Stimmen; axe-core ohne Befunde.

Datenbank (Migration `supabase/migrations/20261014090600_stabile_ergebnisse.sql`):

- Der Fremdschlüssel `votes_member_fkey` (Kaskade) entfällt; neue Spalte `votes.voter_name`.
- `leave_room`: In einer offenen Runde wird die Stimme gelöscht (wie bisher). In einer aufgedeckten
  Runde bleibt sie samt Namen (`voter_name`) bis zum nächsten Rundenstart erhalten.
- Der Snapshot liefert bei solchen Stimmen zusätzlich `display_name`; `RevealedResults` nutzt ihn,
  wenn die Person nicht mehr in der Mitgliederliste steht.
- Datenschutz: Der Name einer Person, die nach dem Aufdecken die Teilnahme entfernt, bleibt bis zum
  nächsten Rundenstart im Ergebnis sichtbar (der Hinweis steht in der Oberfläche).
- Die App funktioniert auch vor dem Anwenden der Migration (dann wie bisher: Stimme verschwindet).

Geprüft: Die Migrationen 1-8 wurden in einer lokalen PostgreSQL-16-Datenbank (Docker, mit Nachbau von
`auth.uid()` und den Rollen) nacheinander angewendet und die Funktionen mit zwei Benutzern
durchgespielt: Entfernen in offener Runde löscht die Stimme; Entfernen nach dem Aufdecken behält
Stimme und Namen im Snapshot der anderen Person; Mitgliederzahl sinkt; die nächste Runde löscht alle
Stimmen; Nicht-Mitglieder sehen nichts. Die Oberfläche wurde mit einer nachgestellten Antwort
(Browser-Abfangen der Snapshot-Antwort) geprüft, da die Migration im echten Projekt noch nicht
eingespielt ist: Eine Stimme mit `display_name` erscheint mit dem Namen im Ergebnis.
Nach dem Einspielen der Migration (14.10.2026) gegen das echte Supabase-Projekt geprüft (Headless-Chromium,
zwei getrennte Profile): Entfernen in offener Runde löscht die Stimme (andere Person sieht 1 Stimme);
Entfernen nach dem Aufdecken lässt „Ben · 8“ im Ergebnis der anderen Person stehen; „Noch einmal
schätzen“ räumt auf (0 Stimmen); axe-core ohne Befunde.