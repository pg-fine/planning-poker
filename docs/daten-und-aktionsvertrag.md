# Daten- und Aktionsvertrag

Dieses Dokument legt fest, wie Oberfläche und Datenbank zusammenarbeiten. Es ist die
Grundlage für die Arbeitspakete 003 (Schema), 005–007 (Datenbankfunktionen) sowie
008–011 (Oberfläche, Echtzeit, Konflikte). Abweichungen werden hier nachgezogen.

## 1. Grundsätze

- **Die Datenbank ist maßgeblich.** Die Oberfläche zeigt nur Zustände, die die Datenbank
  bestätigt hat. Aktionen sind Datenbankfunktionen (RPC), keine freien Tabellenschreibzugriffe.
- **Identität** ist die anonyme Supabase-`auth.uid()` des Browsers. Sie wird immer aus der
  Session abgeleitet und nie als Parameter übergeben. Ein Anzeigename ist keine Anmeldung.
- **Ein Raum hat genau eine aktuelle Runde** (oder noch keine). Es gibt keine Historie.
- **Mitgliedschaft, Online-Präsenz und Stimme sind getrennte Dinge.** Wer Mitglied ist,
  muss weder online sein noch abgestimmt haben. Es gibt keine Pflichtabstimmenden.
- **Stimmen sind für Mitglieder lesbar, auch vor dem Aufdecken.** Das Verbergen ist eine
  Vereinbarung der Oberfläche (bewusste Entscheidung, siehe Roadmap), keine Geheimhaltung.
- **Alle Mitglieder haben dieselben Rechte:** Runde starten, aufdecken, Link ansehen,
  verlassen. Abstimmen darf jeder nur für sich selbst.

## 2. Datenmodell

```text
room (Raum)
  id             uuid          interne ID, erscheint nie in Links
  created_at     timestamptz
  revision       bigint        wird bei jeder sichtbaren Zustandsänderung erhöht (für Echtzeit)

room_invite (Einladung)         getrennt von room, nicht frei lesbar
  room_id        uuid  → room
  token          text          geheimes Einladungstoken, eindeutig

room_member (Mitgliedschaft)
  room_id        uuid  → room
  user_id        uuid          auth.uid()
  display_name   text          1–40 Zeichen, doppelte Namen erlaubt
  joined_at      timestamptz
  eindeutig je (room_id, user_id)

round (aktuelle Runde, höchstens eine je Raum)
  room_id        uuid  → room  eindeutig
  round_id       uuid          neu bei JEDEM Rundenwechsel
  title          text          1–120 Zeichen
  status         'open' | 'revealed'
  started_by     uuid
  started_at     timestamptz

vote (Stimme)
  room_id, round_id            verweist auf die aktuelle Runde
  user_id        uuid
  card           Kartenwert
  eindeutig je (room_id, user_id)   → höchstens eine Stimme je Person und Runde
```

### Raum-ID und Einladungstoken

- Die interne `room.id` wird für Datenbankbeziehungen und Echtzeit-Filter verwendet.
- Das **Einladungstoken** ist der Zugang. Es ist kryptografisch zufällig und hat mindestens
  128 Bit Entropie. Umgesetzt als zwei zufällige UUIDs ohne Bindestriche (64 Hex-Zeichen,
  etwa 244 Bit) aus dem Zufallsgenerator des Servers, ohne Abhängigkeit von Erweiterungen.
- Der Einladungslink enthält nur das Token (`/r/<token>`). Das Token läuft nicht ab und kann
  im MVP nicht neu erzeugt werden.
- Mitglieder erhalten das Token ihres Raums über `get_invite_token`, damit sie den Link
  kopieren können. Es gibt keine Liste von Räumen oder Tokens.

### Kartenwerte (abgeschlossene Menge)

Gespeichert wird ein ASCII-Wert, angezeigt wird die Beschriftung:

| Gespeichert | Anzeige | Art        |
| ----------- | ------- | ---------- |
| `0`         | 0       | Zahl       |
| `1`         | 1       | Zahl       |
| `2`         | 2       | Zahl       |
| `3`         | 3       | Zahl       |
| `5`         | 5       | Zahl       |
| `8`         | 8       | Zahl       |
| `13`        | 13      | Zahl       |
| `21`        | 21      | Zahl       |
| `?`         | ?       | Sonderkarte |
| `coffee`    | ☕      | Sonderkarte |

Eine Datenbank-Prüfregel erlaubt ausschließlich diese Werte. Sonderkarten gehen nicht in
numerische Auswertungen ein.

### Eingaben

- **Anzeigename:** Leerraum am Rand wird entfernt; danach 1–40 Zeichen. Doppelte Namen
  in einem Raum sind erlaubt.
- **Titel:** Leerraum am Rand wird entfernt; danach 1–120 Zeichen.
- Die Oberfläche gibt Namen und Titel immer als Text aus, nie als HTML.

## 3. Zustände einer Runde

```text
                 start_round                    reveal_round
(keine Runde) ───────────────▶  open  ───────────────────────▶  revealed
                                 ▲  │                              │
                                 │  └──── start_round ◀────────────┘
                                 └─────── (ersetzt die Runde: neue round_id, Stimmen weg)
```

| Zustand    | Bedeutung                                        | Erlaubt                               |
| ---------- | ------------------------------------------------ | ------------------------------------- |
| keine      | Raum frisch erstellt, noch keine Runde           | `start_round`                         |
| `open`     | Abstimmung läuft                                 | `cast_vote`, `reveal_round`, `start_round` |
| `revealed` | aufgedeckt, Stimmen sind final                   | `start_round`; `reveal_round` ist wirkungslos |

`start_round` ist aus jedem Zustand möglich und ersetzt die vorhandene Runde vollständig.

## 4. Aktionen

Alle Aktionen laufen als Datenbankfunktionen. Sie prüfen die Session (`auth.uid()` vorhanden)
und, außer bei Raumerstellung und Beitritt, die Mitgliedschaft im betroffenen Raum.

| Aktion                                   | Eingabe                                        | Rückgabe                         |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------- |
| `create_room`                            | `display_name`                                 | `room_id`, `invite_token`        |
| `join_room`                              | `invite_token`, `display_name`                 | `room_id`                        |
| `leave_room`                             | `room_id`                                      | –                                |
| `get_invite_token`                       | `room_id`                                      | `invite_token`                   |
| `get_room_state` (Snapshot)              | `room_id`                                      | siehe Abschnitt 5                |
| `start_round`                            | `room_id`, `expected_round_id`, `title`        | neuer Zustand (Snapshot)         |
| `reveal_round`                           | `room_id`, `round_id`                          | neuer Zustand (Snapshot)         |
| `cast_vote`                              | `room_id`, `round_id`, `card`                  | neuer Zustand (Snapshot)         |

Verhalten im Einzelnen:

- **`create_room`**: legt Raum, Einladung und die Mitgliedschaft des Erstellers in einer
  Transaktion an. Es startet noch keine Runde.
- **`join_room`**: sucht den Raum über das Token. Ist die Person schon Mitglied, wird nur der
  Anzeigename aktualisiert (idempotent, kein Duplikat). Ein ungültiges Token liefert
  `invalid_token`, ohne etwas über andere Räume preiszugeben.
- **`leave_room`**: entfernt die Mitgliedschaft und die eigene Stimme der aktuellen Runde in
  einer Transaktion. Raum und Runde bleiben bestehen. Wiederbeitritt per Link ist möglich;
  die entfernte Stimme kommt nicht zurück. Ein zweiter Aufruf liefert `not_member`; die
  Oberfläche behandelt das als erfolgreich. Die Oberfläche ruft die Funktion nur über die
  bestätigte Aktion „Teilnahme entfernen“ auf; „Zur Startseite“ ändert keine Daten (Paket 019).
- **`start_round`**: `expected_round_id` ist die Runden-ID, die der Aufrufer zuletzt gesehen
  hat (`null`, wenn er noch keine Runde kannte). Stimmt sie mit der aktuellen Runde überein,
  werden alle Stimmen gelöscht und die Runde mit neuer `round_id`, neuem Titel und Status
  `open` ersetzt. Sonst `round_conflict`.
- **`reveal_round`**: setzt `open` auf `revealed`, aber nur für die übergebene `round_id`.
  Ist die Runde schon aufgedeckt, bleibt der Zustand unverändert und der Aufruf gilt als
  erfolgreich (Wiederholung ist unschädlich). Eine Runde ohne Stimmen darf aufgedeckt werden.
  Passt die `round_id` nicht zur aktuellen Runde: `round_conflict`.
- **`cast_vote`**: legt die eigene Stimme an oder ersetzt sie, solange die Runde `open` ist.
  Gleiche Karte erneut senden ändert nichts.

### Fehlercodes

Funktionen melden fachliche Fehler als stabile Codes; die Oberfläche übersetzt sie in deutsche
Meldungen.

| Code                | Ursache                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `not_authenticated` | Keine Session                                                        |
| `invalid_token`     | Einladungstoken unbekannt oder fehlerhaft                            |
| `not_member`        | Kein Mitglied des Raums (auch bei nicht existierender Raum-ID)       |
| `invalid_name`      | Name leer oder länger als 40 Zeichen                                 |
| `invalid_title`     | Titel leer oder länger als 120 Zeichen                               |
| `invalid_card`      | Kartenwert nicht in der erlaubten Menge                              |
| `no_round`          | Aktion setzt eine Runde voraus, es gibt keine                        |
| `round_conflict`    | Übergebene Runden-ID ist nicht (mehr) die aktuelle                   |
| `round_not_open`    | Stimmabgabe, obwohl die Runde schon aufgedeckt ist                   |

`not_member` wird absichtlich auch für unbekannte Räume verwendet, damit niemand Raum-IDs
ausprobieren kann.

## 5. Zustands-Snapshot

`get_room_state` und die Rückgaben der Mutationen liefern denselben Aufbau. Er enthält
nur Daten eines Raums, in dem der Aufrufer Mitglied ist.

```text
room_id
revision                 aktuelle Raumrevision
me                       { user_id, display_name }
members                  [{ user_id, display_name }]        Mitglieder, keine Online-Liste
round                    null | {
                           round_id, title, status,
                           votes: [{ user_id, card }]       alle Stimmen der aktuellen Runde
                         }
```

Die Oberfläche zeigt vor dem Aufdecken nur die Anzahl der Stimmen und die eigene Karte. Die
Liste `members` ist eine Mitgliederliste und wird nie als „online“ oder „muss abstimmen“
dargestellt.

## 6. Gleichzeitigkeit

Alle schreibenden Aktionen sperren zuerst die Zeile des betroffenen Raums
(`SELECT … FOR UPDATE`). Dadurch laufen sie je Raum nacheinander. Die erwartete Runden-ID
verhindert, dass eine verspätete Aktion die neue Runde trifft.

| Situation                                                    | Ergebnis                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Zwei `start_round` mit gleicher `expected_round_id`          | Erste wird ausgeführt, zweite erhält `round_conflict`               |
| `reveal_round` für die vorherige Runde nach neuer Runde      | `round_conflict`, die neue Runde bleibt verdeckt                    |
| `cast_vote` und `reveal_round` gleichzeitig                  | Stimme vor dem Aufdecken zählt; danach `round_not_open`            |
| `cast_vote` für alte Runde nach Rundenwechsel                | `round_conflict`, keine Stimme in der neuen Runde                   |
| Zweimal `reveal_round` für dieselbe Runde                    | Beide erfolgreich, ein Zustandswechsel                              |
| Doppelklick auf „Neue Runde“                                 | Zweiter Aufruf trägt alte ID → `round_conflict`, nicht Ersatz       |
| Mehrere Tabs derselben Identität                             | Eine Stimme (eindeutig je Raum/Person), letzte Auswahl gewinnt      |

Die Revision (`room.revision`) steigt innerhalb derselben Transaktion bei jeder tatsächlichen
Änderung: Beitritt/Austritt, Namensänderung, Rundenwechsel, Aufdecken und neue oder geänderte
Stimme. Wirkungslose Wiederholungen erhöhen sie nicht. Sie dient der Echtzeit (010) als
zuverlässiges Signal, auch wenn Zeilen gelöscht wurden.

## 7. Verbindungsabbrüche und Wiederaufruf

- Gespeicherte Stimmen und die Runde bleiben bei Verbindungsabbrüchen unverändert.
- Das Öffnen eines Raum-Links startet nie automatisch eine Runde. Nur `start_round` tut das.
- Nach Reconnect lädt die Oberfläche einen Snapshot. Eine lokal gemerkte Kartenauswahl wird
  mit der gespeicherten Stimme abgeglichen und nie in eine neue Runde übertragen.
- Bei unklarer Antwort auf eine Mutation zuerst Snapshot laden. Rundenwechsel werden nicht
  blind wiederholt; die erwartete Runden-ID schützt zusätzlich.

### Anwesenheit (Presence, Paket 020)

Wer gerade im Raum online ist, kommt nicht aus der Datenbank, sondern aus einem
Realtime-Presence-Kanal `presence:<room_id>`. Jeder geöffnete Raum meldet nur die eigene
Nutzer-ID. Namen stammen weiter aus der Mitgliederliste. Die Schätzgruppe für „x von y abgestimmt“
sind die gerade online anwesenden Mitglieder (inklusive der eigenen Person). Frühere Mitglieder
zählen nicht mit, bleiben aber mit ihrem Haken unter „Nicht online“ sichtbar, wenn sie abgestimmt
haben. Der Kanal ist nicht privat: Wer die Raum-ID kennt, könnte anonyme Nutzer-IDs sehen, aber
weder Namen noch Stimmen. Die Raum-ID erfährt nur, wer Mitglied ist. Ein privater Kanal würde
eine Realtime-Richtlinie in der Datenbank brauchen. Presence sagt nicht, ob jemand mitschätzt
oder nur zusieht.

## 8. Durchgespielte Beispielrunde

Anna und Ben, Raum noch ohne Runde (Revision 1, `round = null`).

1. Anna: `create_room("Anna")` → Raum, Token. Anna teilt `/r/<token>` im Teams-Chat.
2. Ben: `join_room(token, "Ben")` → Mitglied. Revision 2.
3. Anna: `start_round(room, null, "STORY-1")` → Runde R1, `open`. Revision 3.
4. Ben: `start_round(room, null, "STORY-2")` zeitgleich → `round_conflict`, weil R1 existiert.
   Ben lädt den Snapshot und sieht R1.
5. Anna: `cast_vote(room, R1, "5")`. Ben: `cast_vote(room, R1, "8")`, dann
   `cast_vote(room, R1, "13")`. Ben hat weiter genau eine Stimme (`13`). Revision 4–6.
6. Anna sieht „2 von 2 Stimmen“, nur ihre Karte `5`. Ben deckt auf:
   `reveal_round(room, R1)` → `revealed`. Alle sehen Anna `5`, Ben `13`.
7. Anna: `cast_vote(room, R1, "3")` → `round_not_open`.
8. Anna und Ben klicken gleichzeitig auf „Neue Runde“ (beide mit `expected = R1`):
   Erste Aktion erzeugt R2 und löscht alle Stimmen, zweite erhält `round_conflict`.
9. Ben schließt den Browser. Raum und R2 bleiben bestehen. Öffnet Ben den
   Link später, ist er weiterhin Mitglied (gleiche Browser-Identität) und sieht R2.

## 9. Festgehaltene Entscheidungen und offene Punkte

Entschieden:

- Name 1–40, Titel 1–120 Zeichen; Kartenwert `coffee` statt Emoji gespeichert.
- Einladungstoken: 64 Hex-Zeichen (zwei UUIDs), ohne Ablauf, im MVP nicht erneuerbar.
- Raumrevision als Echtzeitsignal wird bereits im Modell vorgesehen.
- `not_member` für unbekannte Räume, kein Unterschied zu fremden Räumen.

Bewusst nicht Teil des MVP und deshalb offen:

- Raum umbenennen, Token erneuern, Mitglieder entfernen, Räume löschen.
- Aufräumen verwaister Räume. Anonyme Identitäten ohne Mitgliedschaft dürfen später
  manuell bereinigt werden; Räume löscht nichts automatisch (siehe Arbeitspaket 013).
- Verhalten bei sehr vielen Mitgliedern. Bei Teamgröße ist keine Begrenzung vorgesehen.
