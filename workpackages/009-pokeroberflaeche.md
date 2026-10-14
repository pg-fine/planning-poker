# 009 – Karten und Ergebnisse: Oberfläche

- **Status:** Offen
- **Abhängigkeiten:** 006, 007, 008
- **Meilenstein:** M3

## Ziel

Eine komplette Schätzrunde über die Oberfläche spielbar machen.

## Aufgaben

- Titel eingeben und erste/neue Runde starten lassen.
- Fibonacci-Karten inklusive `?` und `☕` als auswählbare Buttons darstellen.
- Eigene Auswahl kenntlich machen; weitere Auswahl bis zum Aufdecken ermöglichen.
- Vor dem Aufdecken nur Anzahl abgegebener Stimmen und eigene Karte anzeigen.
- Aufdecken für alle Mitglieder anbieten; danach Kartenwerte mit Namen darstellen.
- Sonderkarten ohne numerische Durchschnittsberechnung darstellen.
- Leere Runde und Runde ohne eigene Stimme sinnvoll anzeigen.
- Aktionen erst nach bestätigtem Datenbankerfolg als gespeichert darstellen.
- Nach jeder eigenen Mutation den aktuellen Zustand laden; Echtzeit folgt in 010.

## Abnahmekriterien

- Titel, Auswahl, Auswahländerung, Aufdecken und neue Runde sind ohne API-Konsole möglich.
- Fremde Karten erscheinen vor Aufdecken nicht als sichtbarer Text, Tooltip oder
  Screenreader-Beschriftung; technische Auslesbarkeit der Daten ist bewusst akzeptiert.
- Nach Aufdecken ist die Auswahl gesperrt; eine neue Runde zeigt keine alten Stimmen.
- Namen und Titel werden als Text gerendert, nicht als HTML.

## Prüfung und Ergebnis

Eine Runde mit Zahlen und Sonderkarten manuell durchspielen. Zweite Session vorerst
per Reload aktualisieren. Typecheck, Lint und Build ausführen; Testcode nur nach Bugfund.
