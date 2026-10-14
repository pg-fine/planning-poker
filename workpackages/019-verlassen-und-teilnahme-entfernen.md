# 019 – „Zur Startseite“ und „Teilnahme entfernen“ trennen

- **Status:** Teilweise erledigt (Oberfläche); stabile Ergebnisse nach „Teilnahme entfernen“ offen
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

Noch offen (bewusst nicht umgesetzt): „Aufgedeckte Ergebnisse bleiben bis zum nächsten Rundenstart
stabil“, auch wenn jemand die Teilnahme entfernt. Das ist keine kleine Anpassung von `leave_room`:
`votes` hängt per Fremdschlüssel an `room_members` (Löschen kaskadiert), und Namen im Ergebnis
stammen aus der Mitgliederliste. Nötig wären Schema- und Leseänderungen (z. B. Name und Stimme
einer entfernten Person in der aufgedeckten Runde festhalten). Das braucht eine Migration, die im
Supabase-Projekt angewendet werden muss, und eine Entscheidung zum Datenschutz (Name bleibt im
Ergebnis stehen).
