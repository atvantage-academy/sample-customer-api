# Musterlösung: Account Service API — 03 · Hypermedia (HAL)

Die **Musterlösung** zur Entwurfsübung aus dem Training
**„REST APIs – Grundlagen und Design“** der [ATVANTAGE Academy](https://atvantage.com).

Im Kurs zerlegen die Teilnehmenden einen Online-Shop in Dienste und entwerfen
anschließend die API eines davon: der **Kundenverwaltung** (*Account Service*).
Was hier liegt, ist **eine** mögliche Lösung dieser Aufgabe – nicht die einzige
richtige.

## Was Du hier findest

| Datei | Was drinsteht |
| ----- | ------------- |
| [`docs/design.md`](docs/design.md) | Der **formlose Entwurf** – so, wie er im Kurs am ersten Tag entsteht: Ressourcen, Operationen, Statuscodes. Mit den Alternativen, die zur Diskussion standen. |
| [`openapi.yaml`](openapi.yaml) | Derselbe Entwurf als **OpenAPI 3.1** – das Ergebnis des zweiten Tages. |
| [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/) | Dieselbe Beschreibung als **durchsuchbare Dokumentation** zum Anklicken. |

## Was dieser Stand ändert

Die Kunden-Antworten bekommen eine **zweite Darstellung**: `application/hal+json`
mit einem `_links`-Block. Die alte unter `application/json` bleibt unverändert.

| | `02-problem-details` | `03-hypermedia-hal` |
| --- | --- | --- |
| Kunde lesen | `application/json` | zusätzlich `application/hal+json` |
| Liste lesen | `{ items, nextCursor }` | zusätzlich `{ _links, _embedded }` |
| Nächste Seite | Cursor selbst anhängen | dem `_links.next` folgen |

```
GET /customers/{id}
Accept: application/hal+json

→ 200
{
  "id": "3fa85f64-…", "name": "Tom Mayer", "state": "aktiv",
  "_links": {
    "self":       { "href": "/customers/3fa85f64-…" },
    "address":    { "href": "/customers/3fa85f64-…/address" },
    "payments":   { "href": "/customers/3fa85f64-…/payments" },
    "deactivate": { "href": "/customers/3fa85f64-…/flags/deactivation" },
    "lock":       { "href": "/customers/3fa85f64-…/flags/lock" }
  }
}
```

### Der eigentliche Punkt: Die Verweise hängen vom Zustand ab

| `state` | vorhandene Beziehungen |
| ------- | ---------------------- |
| `aktiv` | `self`, `address`, `payments`, `deactivate`, `lock` |
| `deaktiviert` | `self`, `address`, `payments`, `activate`, `lock` |
| `gesperrt` | `self`, `address`, `payments`, `unlock` |

Ein gesperrtes Konto lässt sich nicht deaktivieren – also fehlt der Verweis. Ein
deaktiviertes lässt sich sehr wohl sperren – also ist `lock` da.

Dieselbe Regel stand vorher in der Dokumentation. Jetzt steht sie **in der
Antwort**. Eine Oberfläche kann ihre Knöpfe daraus bauen, ohne zu wissen, was ein
gesperrtes Konto ist; ändert sich die Regel, zieht sie ohne Änderung mit.

**Genau dafür lohnt sich Hypermedia** – und meistens nur dafür: Abläufe mit
mehreren Zuständen, bei denen nicht jeder Schritt immer erlaubt ist.

### Und hier hört HAL auf

Ein HAL-Link kennt `href`. **Eine Methode kennt er nicht.**

`deactivate` und `activate` zeigen auf dieselbe Adresse. Der eine meint `PUT`, der
andere `DELETE`. In der Antwort steht davon nichts – die Bedeutung steckt allein im
Namen der Beziehung, und den muss der Client vorher kennen. Wer die Methode
mitliefern will, braucht HAL-FORMS, Siren oder JSON:API.

Eine zweite Grenze zeigt sich in der Beschreibung selbst: Dass `deactivate` nur bei
`aktiv` vorkommt, steht dort in **Prosa**. OpenAPI kann „dieses Feld gibt es nur,
wenn `state` gleich `aktiv` ist“ nicht ausdrücken, ohne das Schema in drei
`oneOf`-Varianten zu zerlegen – was die Beschreibung verdreifacht und kaum jemand
liest.

### Warum das kein Bruch ist

`_embedded.customers` statt `items` wäre für jeden bestehenden Aufrufer ein Bruch.
Deshalb wird HAL nicht eingebaut, sondern **danebengestellt**:

```
Accept: application/json       → { "items": [ … ], "nextCursor": … }   wie bisher
Accept: application/hal+json   → { "_links": …, "_embedded": … }       neu
```

Eine Ressource, zwei Darstellungen, der Client wählt. Content Negotiation ist die
eleganteste Antwort auf „wir müssen das Format ändern“, die HTTP zu bieten hat.

In der Swagger UI steht `application/hal+json` **an erster Stelle** – Du siehst
dort also die HAL-Antwort, ohne etwas umzuschalten. Über das Feld *Media type*
über dem Beispiel kommst Du zur gewohnten Darstellung zurück und siehst den
Unterschied unmittelbar.

Ausführlich in [`docs/design.md`](docs/design.md#hypermedia).

## Die Stände

Du bist im Stand `03-hypermedia-hal`. Er baut auf `02-problem-details` auf – jeder Stand
ergänzt genau ein Thema, sodass der letzte die vollständige API zeigt. In der
Swagger UI schaltest Du oben links zwischen ihnen um.

| Stand | Was dazukommt | Ansehen | Diff |
| ----- | ------------- | ------- | ---- |
| [`main`](https://atvantage-academy.github.io/sample-customer-api/?spec=main) | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=main) · [YAML](../../blob/main/openapi.yaml) | – |
| [`01-paginierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) | Cursorbasiertes Blättern über die Kundenliste | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) · [YAML](../../blob/01-paginierung/openapi.yaml) | [PR #2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
| [`02-problem-details`](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) | Fehlerformat nach RFC 9457 statt des eigenen | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) · [YAML](../../blob/02-problem-details/openapi.yaml) | [PR #3](https://github.com/atvantage-academy/sample-customer-api/pull/3) |
| `03-hypermedia-hal` **· Du bist hier** | HAL: Die Antwort trägt ihre nächsten Schritte mit | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) · [YAML](../../blob/03-hypermedia-hal/openapi.yaml) | [PR #4](https://github.com/atvantage-academy/sample-customer-api/pull/4) |
| [`04-autorisierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=04-autorisierung) | OAuth 2, Scopes, `401` und `403` | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=04-autorisierung) · [YAML](../../blob/04-autorisierung/openapi.yaml) | [PR #5](https://github.com/atvantage-academy/sample-customer-api/pull/5) |

**Die Diff-Spalte ist der interessanteste Teil.** Jeder Stand hat einen Pull
Request gegen die Zeile darüber, und der bleibt **bewusst offen** – er wird nie
gemergt. Er zeigt Zeile für Zeile, was ein einzelnes Thema an einer fertigen API
verändert: *Was macht Paginierung aus einer Listenoperation? Was kostet Hypermedia,
und was bekommt man dafür?* Worauf dabei zu achten ist, steht jeweils in der
Beschreibung des Pull Requests.

Wer das Repository geklont hat, kommt auch ohne Browser dorthin:

```
# Was fügt die Paginierung hinzu?
git diff main..01-paginierung -- openapi.yaml

# Was ändert HAL gegenüber dem Stand davor?
git diff 02-problem-details..03-hypermedia-hal -- openapi.yaml
```

## Lies das hier nicht zu früh

Der Wert der Übung liegt im **eigenen Entwurf**, nicht im Abgleich mit einer
Vorlage. Wer die Musterlösung vor der Übung liest, nimmt sich genau den Teil, an
dem man API-Design lernt.

Nach der Übung lohnt sich der Blick dafür umso mehr – und zwar **kritisch**: An
mindestens drei Stellen hättest Du es anders gemacht. Genau diese Stellen sind das
Gespräch wert.

## Es gibt nicht die eine richtige API

An mehreren Punkten dieser Lösung waren mehrere Wege vertretbar. Wo das so ist,
steht es in [`docs/design.md`](docs/design.md) ausdrücklich dabei – mit den
Argumenten für jede Variante. Das ist keine Unentschlossenheit, sondern der
eigentliche Inhalt des Kurses:

> Eine API-Entscheidung ist selten richtig oder falsch. Sie hat Folgen – und die
> sollte man benennen können.

## Was hier bewusst fehlt

- **Eine Implementierung.** Dieses Repository beschreibt eine Schnittstelle, es
  bedient sie nicht. Der Kurs ist sprach- und frameworkneutral.
- **Ein Server.** Die Adressen zeigen auf `example.com`, weil es nichts gibt, was
  dahinter antwortet. „Try it out“ ist deshalb abgeschaltet.
- **Versionierung, Caching, Suche.** Themen des Kurses, die den Entwurf hier nicht
  verändert hätten – sie stehen in den Unterlagen, nicht in diesem Dokument.

## Verwendung

Die Inhalte dürfen für eigene Zwecke genutzt und angepasst werden. Rückfragen zum
Training: [academy@atvantage.com](mailto:academy@atvantage.com).
