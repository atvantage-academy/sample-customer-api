# Account Service – der formlose Entwurf

So sieht das Ergebnis des ersten Kurstages aus: formlos, aber vollständig genug,
dass ein anderes Team damit arbeiten kann. Kein OpenAPI, keine Security – das kommt
später bzw. in einem eigenen Kurs.

**Annahme durchgehend:** JSON ist das einzige Austauschformat. `Accept` und
`Content-Type` sind deshalb unten nicht bei jeder Operation erwähnt.

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
GET /customers?state=aktiv&page=1&size=50
→ 200  { "items": [ … ], "total": 1242 }
→ 400  ungültiger Parameter
```

**Die Liste ist ein Objekt mit einem Feld, kein nacktes Array.** Nur so lassen sich
später Gesamtzahl, Seitenangaben oder Verweise ergänzen, ohne einen einzigen
Aufrufer zu brechen.

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

## Die Entscheidungen, über die man streiten kann

Diese vier Stellen sind die, an denen im Kurs die Gruppen auseinandergehen. Keine
der Varianten ist falsch.

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
Übersichtsantwort.

*Die Alternative:* Bezahldaten als Felder des Kunden, geändert per PATCH. Weniger
Ressourcen, einfacher zu lesen – aber jede Berechtigungsregel muss dann auf
Feldebene greifen, und das kann HTTP nicht.

*Und die Frage, die daraus folgt:* Wie liest man Kunden **mit** Bezahldaten, wenn
man sie doch braucht? Zwei Wege: eine eigene Ressource (`/customers-with-payments`,
saubere Trennung der Schemas) oder ein Parameter (`/customers?include=payments`,
kombinierbar mit Filtern und Paginierung, dafür ohne getrennte Schemas).

### Deaktivieren: Feld, Aktion oder Schalter?

**Gewählt: ein Schalter als Subressource.**

```
PUT    /customers/{id}/flags/deactivation   → 204   deaktivieren
DELETE /customers/{id}/flags/deactivation   → 204   wieder aktivieren
GET    /customers/{id}/flags/deactivation   → 200 | 404
```

*Warum:* **idempotent** (zweimal deaktivieren ändert nichts), lesbar, und der
Zustand ist einzeln abfragbar. Es ist der einzige der drei Wege, bei dem ein
wiederholter Aufruf garantiert harmlos ist.

*Alternative 1 – Status als Feld:*

```
PATCH /customers/{id}   { "state": "deaktiviert" }
```

Am einfachsten, und bei mehr als zwei Zuständen (hier kommt `gesperrt` dazu!) meist
der praktischere Weg. Nachteil: Der Vorgang ist nicht sichtbar – man sieht den
Zustand, nicht den Übergang.

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

`GET /customers` ohne Grenze ist eine Zeitbombe. Der Entwurf oben sieht deshalb
`page` und `size` vor, mit Vorgabe und Obergrenze.

Für einen nächtlichen Abzug wäre **cursorbasiertes** Blättern die bessere Wahl –
seitenbasiertes Blättern liefert Einträge doppelt oder gar nicht, wenn sich der
Bestand zwischendurch ändert. Ausführlich in den
[Zalando-Guidelines](https://opensource.zalando.com/restful-api-guidelines/#pagination).

### Mehrere Kunden auf einmal

Kommt regelmäßig als Wunsch: *„Können wir nicht 500 Kunden in einem Aufruf
anlegen?“* Möglich ist es – die Frage ist, was bei **teilweisem** Erfolg passiert.
Ein Statuscode für 500 Ergebnisse reicht nicht.

Übliche Antwort: der Auftrag als eigene Ressource, deren Ergebnis man abfragt.
Lesenswert dazu: [Bulk and Batch
Operations](https://www.mscharhag.com/api-design/bulk-and-batch-operations).

## Fehler

Alle Fehlerantworten folgen **RFC 9457** (*Problem Details*), Medientyp
`application/problem+json`:

```json
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Die Kundendaten sind nicht gültig",
  "status": 400,
  "detail": "2 Felder sind fehlerhaft.",
  "errors": [
    { "field": "name", "message": "mindestens 3 Zeichen" },
    { "field": "birthdate", "message": "darf nicht in der Zukunft liegen" }
  ]
}
```

**Auswertbar ist `type`** – darauf darf ein Programm Logik bauen. `title` und
`detail` sind für Menschen und dürfen sich jederzeit ändern.

Und was **nicht** hineingehört: Stacktraces, Klassennamen, SQL-Fragmente, Pfade.
Eine Fehlerantwort geht nach außen.
