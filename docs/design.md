# Account Service – der formlose Entwurf

So sieht das Ergebnis des ersten Kurstages aus: formlos, aber vollständig genug,
dass ein anderes Team damit arbeiten kann. Kein OpenAPI, keine Security – das kommt
später bzw. in einem eigenen Kurs.

**Annahme durchgehend:** JSON ist das einzige Austauschformat. `Accept` und
`Content-Type` sind deshalb unten nicht bei jeder Operation erwähnt.

> **Dies ist der Stand `01-paginierung`.** Er baut auf `main` auf und ergänzt das
> cursorbasierte Blättern – siehe [Eine Million Kunden](#eine-million-kunden). Die
> übrigen Stände stehen unten unter
> [Weiterführende Stände](#weiterführende-stände).

## Die Daten

Ein Kunde hat:

- eine **Kennung** (unveränderlich, vom Server vergeben)
- einen **Namen**
- ein **Geburtsdatum**
- eine **Anschrift**
- **Bezahlinformationen**: Kreditkarte und/oder PayPal
- einen **Status**: `aktiv`, `deaktiviert`, `gesperrt`

## Die Ressourcen

```
/customers                              Liste aller Kunden
/customers/{id}                         ein einzelner Kunde
/customers/{id}/address                 seine Anschrift
/customers/{id}/payments                alle Bezahldaten
/customers/{id}/payments/paypal         die PayPal-Daten
/customers/{id}/payments/creditcard     die Kreditkartendaten
/customers/{id}/flags/deactivation      der Deaktivierungs-Schalter
/customers/{id}/flags/lock              der Sperr-Schalter
```

## Warum die Kennung nicht die E-Mail-Adresse ist

Naheliegend wäre `/customers/tom@acme.com` – lesbar, fachlich, kein zusätzliches
Feld. Der Haken: **Menschen wechseln ihre E-Mail-Adresse.** Eine Kennung muss
eindeutig *und unveränderlich* sein, sonst bricht jeder gespeicherte Verweis.

Hier ist die Kennung deshalb eine UUID. Eine fortlaufende Nummer täte es auch –
mit dem Nachteil, dass sie verrät, wie viele Kunden es gibt und wann jemand
angelegt wurde.

## Die Operationen

### Alle Kunden lesen

```
GET /customers?state=aktiv&limit=50&cursor=eyJhZnRlciI6IjNmYTg1ZjY0In0
→ 200  { "items": [ … ], "nextCursor": "eyJhZnRlciI6IjkxYzAxZjIzIn0" }
→ 400  ungültiger Parameter oder abgelaufener Cursor
```

**Die Liste ist ein Objekt mit einem Feld, kein nacktes Array.** Genau davon lebt
dieser Stand: `nextCursor` ist ein **neues Feld in einem bestehenden Objekt** und
bricht keinen einzigen Aufrufer von `main`. Wäre die Antwort ein nacktes Array
gewesen, hätte die Paginierung sie ersetzen müssen – und das ist ein Bruch.

Warum überhaupt geblättert wird und warum mit einem Cursor statt mit `page`, steht
unter [Eine Million Kunden](#eine-million-kunden).

Die Bezahldaten sind hier **nicht** enthalten – siehe
[Bezahldaten](#bezahldaten-eingebettet-oder-eigene-ressource).

### Einen Kunden lesen

```
GET /customers/{id}
→ 200  der Kunde, ohne Bezahldaten
→ 404  diese Kennung gibt es nicht
```

### Einen Kunden anlegen

```
POST /customers
     { Kundendaten ohne Kennung }
→ 201  Location: /customers/{id}
       der angelegte Kunde, mit Kennung
→ 400  Daten unvollständig oder unplausibel
```

**POST, nicht PUT**, weil der **Server** die Kennung vergibt. Deshalb ist die
Operation auch nicht idempotent: Zweimal gesendet heißt zwei Kunden.

### Einen Kunden ersetzen

```
PUT /customers/{id}
    { Kundendaten ohne Kennung }
→ 200  der ersetzte Kunde
→ 400  Daten unvollständig oder unplausibel
→ 404  diese Kennung gibt es nicht
```

**Achtung, der häufigste Denkfehler:** PUT *ersetzt*. Felder, die nicht mitkommen,
sind danach leer. Wer nur ein Feld ändern will, nimmt PATCH.

### Einen Kunden teilweise ändern

```
PATCH /customers/{id}
      Content-Type: application/merge-patch+json
      { nur die zu ändernden Felder }
→ 204
→ 400  Änderung unplausibel
→ 404  diese Kennung gibt es nicht
```

### Einen Kunden löschen

```
DELETE /customers/{id}
→ 204
→ 404  diese Kennung gibt es nicht
```

Idempotent: Beim zweiten Mal ist der Kunde immer noch weg. Ob dann `204` oder `404`
kommt, ist eine Entwurfsentscheidung – hier `404`, weil der Aufrufer so erfährt,
dass er auf etwas Nicht-Existierendes gezeigt hat.

### Die Anschrift

```
GET /customers/{id}/address     → 200 | 404
PUT /customers/{id}/address     → 204 | 400 | 404
```

Es gibt genau **eine** Anschrift, und der Client kennt ihren Inhalt vollständig –
deshalb PUT und nicht POST. Zweimal gesendet ändert nichts: idempotent.

### Die zwei Schalter

```
GET    /customers/{id}/flags/deactivation   → 200 | 404
PUT    /customers/{id}/flags/deactivation   → 204 | 404 | 409
DELETE /customers/{id}/flags/deactivation   → 204 | 404

GET    /customers/{id}/flags/lock           → 200 | 404
PUT    /customers/{id}/flags/lock           → 204 | 404
DELETE /customers/{id}/flags/lock           → 204 | 404
```

**Zwei Schalter, nicht einer mit zwei Werten** – weil es zwei verschiedene Vorgänge
sind, die verschiedene Leute auslösen: Die **Deaktivierung** veranlasst der Kunde
(„ich will hier weg“), die **Sperre** der Betreiber („Zahlungsrückstand“). Beide
können gleichzeitig gelten.

Daraus ergibt sich der Status, und zwar **abgeleitet**, nicht gesetzt:

| Sperre | Deaktivierung | `state` |
| ------ | ------------- | ------- |
| –      | –             | `aktiv` |
| –      | gesetzt       | `deaktiviert` |
| gesetzt | egal         | `gesperrt` |

Die Sperre hat Vorrang, und daraus folgen zwei Regeln:

- Ein **gesperrtes** Konto lässt sich **nicht** deaktivieren → `409`. Eine
  Deaktivierung wäre eine Abschwächung, und die darf der Kunde nicht selbst
  vornehmen.
- Ein **deaktiviertes** Konto lässt sich sehr wohl sperren. Der Betreiber kommt
  immer durch.

Und ein Fallstrick, der im Kurs zuverlässig auffällt: `DELETE …/flags/lock` macht
ein Konto **nicht** automatisch aktiv. War zusätzlich die Deaktivierung gesetzt,
ist es danach `deaktiviert`. Wer zwei Schalter baut, muss beide zurückdrehen.

## Die Entscheidungen, über die man streiten kann

Diese Stellen sind die, an denen im Kurs die Gruppen auseinandergehen. Keine der
Varianten ist falsch.

### Bezahldaten: eingebettet oder eigene Ressource?

**Gewählt: eigene Subressourcen.**

```
GET    /customers/{id}/payments              alle Bezahldaten
GET    /customers/{id}/payments/paypal       → 200 | 404
PUT    /customers/{id}/payments/paypal       → 204 | 400 | 404
DELETE /customers/{id}/payments/paypal       → 204 | 404
GET    /customers/{id}/payments/creditcard   → 200 | 404
PUT    /customers/{id}/payments/creditcard   → 204 | 400 | 404
DELETE /customers/{id}/payments/creditcard   → 204 | 404
```

*Warum:* Bezahldaten haben **andere Schutzbedürfnisse** als ein Name. Als eigene
Ressourcen lassen sie sich getrennt berechtigen, getrennt protokollieren und aus der
Kundenliste heraushalten – niemand will 1.242 Kreditkartennummern in einer
Übersichtsantwort. Wie das konkret aussieht, zeigt der Stand
[`04-autorisierung`](#weiterführende-stände).

*Die Alternative:* Bezahldaten als Felder des Kunden, geändert per PATCH. Weniger
Ressourcen, einfacher zu lesen – aber jede Berechtigungsregel muss dann auf
Feldebene greifen, und das kann HTTP nicht.

*Und die Frage, die daraus folgt:* Wie liest man Kunden **mit** Bezahldaten, wenn
man sie doch braucht? Zwei Wege: eine eigene Ressource (`/customers-with-payments`,
saubere Trennung der Schemas) oder ein Parameter (`/customers?include=payments`,
kombinierbar mit Filtern und Paginierung, dafür ohne getrennte Schemas).

### Deaktivieren: Feld, Aktion oder Schalter?

**Gewählt: Schalter als Subressourcen** (siehe [oben](#die-zwei-schalter)).

*Warum:* **idempotent** (zweimal deaktivieren ändert nichts), lesbar, und jeder
Zustand ist einzeln abfragbar. Es ist der einzige der drei Wege, bei dem ein
wiederholter Aufruf garantiert harmlos ist.

*Alternative 1 – Status als Feld:*

```
PATCH /customers/{id}   { "state": "deaktiviert" }
```

Am einfachsten, und bei vielen Zuständen meist der praktischere Weg. Nachteil: Der
Vorgang ist nicht sichtbar – man sieht den Zustand, nicht den Übergang. Und man
sieht nicht mehr, **warum** jemand gesperrt ist, wenn er zusätzlich deaktiviert war.

*Alternative 2 – die Aktion als Ressource:*

```
POST /customers/{id}/deactivations   → 201
POST /customers/{id}/activations     → 201
```

Der Vorgang ist benannt und lässt sich protokollieren, mit Zeitpunkt und Grund. Das
ist der stärkste Weg, wenn eine **Historie** gebraucht wird. Nachteil: nicht
idempotent.

**Die Entscheidungsfragen:** Braucht Ihr eine Historie? Muss der Aufruf wiederholbar
sein? Wie viele Zustände gibt es – und kommen noch welche dazu?

### Eine Million Kunden

`GET /customers` **ohne Grenze** ist eine Zeitbombe. Nicht „langsam“, sondern der
Reihe nach kaputt: Die Datenbank hält die Ergebnismenge im Speicher, der Service
baut daraus Objekte und geht auf dem Heap ein, das Gateway puffert und läuft in
seinen Timeout, und der Browser friert beim Parsen ein. Vier Stellen, ein Aufruf.

**Gewählt: cursorbasiert.**

```
GET /customers?limit=50
→ 200  { "items": [ 50 Kunden ], "nextCursor": "eyJhZnRlciI6IjkxYzAxZjIzIn0" }

GET /customers?limit=50&cursor=eyJhZnRlciI6IjkxYzAxZjIzIn0
→ 200  { "items": [ die nächsten 50 ], "nextCursor": null }
```

`nextCursor: null` heißt: Das war die letzte Seite.

*Warum nicht `page` und `size`?* Weil seitenbasiertes Blättern eine Annahme macht,
die nicht hält: **dass sich der Bestand zwischen zwei Anfragen nicht ändert.**

> Seite 1 liefert die Kunden 1–50. Bevor der Aufrufer Seite 2 holt, wird Kunde 3
> gelöscht. Alles rutscht eine Position nach vorn – der frühere Kunde 51 steht
> jetzt auf Position 50. Seite 2 beginnt bei 51. **Ein Kunde wurde nie
> ausgeliefert**, und niemand merkt es: Jede einzelne Antwort war korrekt.

Umgekehrt genauso: Wird jemand eingefügt, erscheint ein Eintrag zweimal. Bei einem
nächtlichen Abzug, der jeden Datensatz genau einmal braucht, ist das der
Unterschied zwischen „läuft“ und „läuft falsch“.

Der Cursor macht diese Annahme nicht. Er beschreibt keine Position in einer Liste,
sondern **einen Punkt im Bestand** – „weiter hinter diesem Eintrag“. Was davor
passiert, ist ihm gleichgültig.

*Der Preis:* Man kann nicht auf Seite 7 springen. Keine Seitenzahlen unten am
Bildschirm, kein „Seite 12 von 340“. Wer eine Oberfläche mit Seitenzahlen bauen
muss, braucht `page`/`size` – und lebt mit den Sprüngen. **Das ist die
Entscheidungsfrage:** Blättert jemand durch, oder arbeitet etwas die Liste ab?

*Und der Cursor ist undurchsichtig.* Er sieht aus wie Base64, und das ist kein
Zufall: Wer ihn auseinandernimmt und die Kennung darin ausliest, baut auf ein
Implementierungsdetail. Er wird weitergereicht, nicht interpretiert.

*Keine Gesamtzahl.* `total` kostet eine zweite, teure Abfrage über den ganzen
Bestand und stimmt trotzdem nur für einen Augenblick. Wer sie wirklich braucht,
soll sie anfordern müssen.

Ausführlich in den
[Zalando-Guidelines](https://opensource.zalando.com/restful-api-guidelines/#pagination).

### Mehrere Kunden auf einmal

Kommt regelmäßig als Wunsch: *„Können wir nicht 500 Kunden in einem Aufruf
anlegen?“* Möglich ist es – die Frage ist, was bei **teilweisem** Erfolg passiert.
Ein Statuscode für 500 Ergebnisse reicht nicht.

Übliche Antwort: der Auftrag als eigene Ressource, deren Ergebnis man abfragt.
Lesenswert dazu: [Bulk and Batch
Operations](https://www.mscharhag.com/api-design/bulk-and-batch-operations).

## Fehler

Jede Fehlerantwort trägt einen Körper, und zwar in **einem** Format – nicht mal so,
mal anders:

```json
{
  "message": "Die Kundendaten sind nicht gültig.",
  "fields": [
    { "field": "name", "message": "mindestens 3 Zeichen" },
    { "field": "birthdate", "message": "darf nicht in der Zukunft liegen" }
  ]
}
```

**Alle fehlerhaften Felder auf einmal** – sonst braucht der Aufrufer mehrere
Anläufe.

Und was **nicht** hineingehört: Stacktraces, Klassennamen, SQL-Fragmente, Pfade.
Eine Fehlerantwort geht nach außen.

Das Format oben ist allerdings **selbst erfunden**. Es tut, was es soll, und jeder
Client muss es trotzdem neu lernen. Dafür gibt es einen Standard – der Stand
[`02-problem-details`](#weiterführende-stände) führt ihn ein.

## Weiterführende Stände

Dieser Entwurf ist der Stand `01-paginierung`. Er baut auf `main` auf, und
darüber liegen weitere Stände. Die Swagger UI schaltet oben links zwischen ihnen
um.

| Stand | Was dazukommt | Kursmodul | Diff |
| ----- | ------------- | --------- | ---- |
| [`main`](https://atvantage-academy.github.io/sample-customer-api/?spec=main) | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | – | – |
| `01-paginierung` **· Du bist hier** | Cursorbasiertes Blättern über die Kundenliste | Best Practices | [PR #2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
| [`02-problem-details`](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) | Fehlerformat nach RFC 9457 statt des eigenen | Best Practices | [PR #3](https://github.com/atvantage-academy/sample-customer-api/pull/3) |
| [`03-hypermedia-hal`](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) | HAL: Die Antwort trägt ihre nächsten Schritte mit | Hypermedia und HAL | [PR #4](https://github.com/atvantage-academy/sample-customer-api/pull/4) |
| [`04-autorisierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=04-autorisierung) | OAuth 2, Scopes, `401` und `403` | Rund um die API | [PR #5](https://github.com/atvantage-academy/sample-customer-api/pull/5) |

Was jeder Stand konkret ändert und **warum**, steht in der `README.md` des
jeweiligen Branches. Die **Diff**-Spalte führt zu einem Pull Request gegen die Zeile
darüber. Er bleibt offen und wird nie gemergt – er zeigt nur die Änderung, Zeile für
Zeile und mit Kommentarmöglichkeit.
