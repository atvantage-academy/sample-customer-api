# Musterlösung: Account Service API

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

## Die Stände

Dieser Branch – `main` – ist **der Kern**: Ressourcen, Methoden, Statuscodes,
Schemas. Mehr nicht, und das mit Absicht. Wer den Entwurf aus der Übung
nachvollziehen will, ist hier richtig.

Die weiterführenden Themen des Kurses liegen in **eigenen Branches**. Jeder baut
auf dem vorigen auf, sodass der letzte die vollständige API zeigt. In der Swagger
UI schaltest Du oben links zwischen ihnen um.

| Stand | Was dazukommt | Ansehen | Diff |
| ----- | ------------- | ------- | ---- |
| `main` **· Du bist hier** | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=main) · [YAML](../../blob/main/openapi.yaml) | – |
| [`01-paginierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) | Cursorbasiertes Blättern über die Kundenliste | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) · [YAML](../../blob/01-paginierung/openapi.yaml) | [PR #2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
| [`02-problem-details`](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) | Fehlerformat nach RFC 9457 statt des eigenen | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) · [YAML](../../blob/02-problem-details/openapi.yaml) | [PR #3](https://github.com/atvantage-academy/sample-customer-api/pull/3) |
| [`03-hypermedia-hal`](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) | HAL: Die Antwort trägt ihre nächsten Schritte mit | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) · [YAML](../../blob/03-hypermedia-hal/openapi.yaml) | [PR #4](https://github.com/atvantage-academy/sample-customer-api/pull/4) |
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
