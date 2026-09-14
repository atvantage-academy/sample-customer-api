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
- **Paginierung in voller Tiefe, Hypermedia, Versionierung.** Diese Themen sind im
  Kurs optionale Bausteine; die Musterlösung deutet sie an, wo es hilft, und bleibt
  sonst schlank.

## Verwendung

Die Inhalte dürfen für eigene Zwecke genutzt und angepasst werden. Rückfragen zum
Training: [academy@atvantage.com](mailto:academy@atvantage.com).
