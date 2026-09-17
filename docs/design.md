# Account Service – der formlose Entwurf

So sieht das Ergebnis des ersten Kurstages aus: formlos, aber vollständig genug,
dass ein anderes Team damit arbeiten kann. Kein OpenAPI, keine Security – das kommt
später bzw. in einem eigenen Kurs.

**Annahme durchgehend:** JSON ist das einzige Austauschformat. `Accept` und
`Content-Type` sind deshalb unten nicht bei jeder Operation erwähnt.

> **Dies ist der Stand `main` – der Kern.** Paginierung, Fehlerformat, Hypermedia
> und Autorisierung stehen bewusst nicht hier, sondern in eigenen Ständen. Was sie
> hinzufügen, steht unten unter [Weiterführende Stände](#weiterführende-stände).

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
GET /customers?state=aktiv
→ 200  { "items": [ … ] }
→ 400  ungültiger Parameter
```

**Die Liste ist ein Objekt mit einem Feld, kein nacktes Array.** Nur so lassen sich
später Gesamtzahl, Seitenangaben oder Verweise ergänzen, ohne einen einzigen
Aufrufer zu brechen. Genau davon lebt der Stand
[`01-paginierung`](#weiterführende-stände): Er ergänzt ein Feld – und bricht
niemanden.

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

Vier Themen des Kurses sind nicht in diesem Entwurf, sondern in eigenen Branches.
Jeder baut auf dem vorigen auf, sodass der letzte die vollständige API zeigt. Die
Swagger UI schaltet oben links zwischen ihnen um.

| Stand | Was dazukommt | Kursmodul |
| ----- | ------------- | --------- |
| [`01-paginierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) | Cursorbasiertes Blättern über die Kundenliste | Best Practices |
| [`02-problem-details`](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) | Fehlerformat nach RFC 9457 statt des eigenen | Best Practices |
| [`03-hypermedia-hal`](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) | HAL: Die Antwort trägt ihre nächsten Schritte mit | Hypermedia und HAL |
| [`04-autorisierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=04-autorisierung) | OAuth 2, Scopes, `401` und `403` | Rund um die API |

Was jeder Stand konkret ändert und **warum**, steht in der `README.md` des
jeweiligen Branches.
