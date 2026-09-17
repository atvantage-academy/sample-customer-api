# Musterlösung: Account Service API — 01 · Paginierung

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

`GET /customers` gibt die Kunden nicht mehr am Stück heraus, sondern
**seitenweise** – und zwar cursorbasiert.

| | `main` | `01-paginierung` |
| --- | --- | --- |
| Parameter | `state` | `state`, **`cursor`**, **`limit`** |
| Antwort | `{ items }` | `{ items, `**`nextCursor`**` }` |
| `400` | ungültiger Parameter | zusätzlich: Cursor abgelaufen |

```
GET /customers?limit=50
→ 200  { "items": [ 50 Kunden ], "nextCursor": "eyJhZnRlciI6IjkxYzAxZjIzIn0" }

GET /customers?limit=50&cursor=eyJhZnRlciI6IjkxYzAxZjIzIn0
→ 200  { "items": [ die nächsten 50 ], "nextCursor": null }
```

`nextCursor: null` heißt: Das war die letzte Seite.

### Warum ein Cursor und keine Seitennummer

Seitenbasiertes Blättern macht eine Annahme, die nicht hält: **dass sich der
Bestand zwischen zwei Anfragen nicht ändert.**

> Seite 1 liefert die Kunden 1–50. Bevor der Aufrufer Seite 2 holt, wird Kunde 3
> gelöscht. Alles rutscht eine Position nach vorn – der frühere Kunde 51 steht
> jetzt auf Position 50. Seite 2 beginnt bei 51. **Ein Kunde wurde nie
> ausgeliefert**, und niemand merkt es: Jede einzelne Antwort war korrekt.

Umgekehrt genauso: Wird jemand eingefügt, erscheint ein Eintrag zweimal. Der
Cursor macht diese Annahme nicht – er beschreibt keine Position in einer Liste,
sondern einen Punkt im Bestand.

**Der Preis:** Man kann nicht auf Seite 7 springen. Wer eine Oberfläche mit
Seitenzahlen braucht, nimmt `page`/`size` und lebt mit den Sprüngen. Die
Entscheidungsfrage lautet: Blättert jemand durch, oder arbeitet etwas die Liste
ab?

### Und was daran didaktisch interessant ist

Dieser Stand ändert eine bestehende Antwort, **ohne einen einzigen Aufrufer zu
brechen** – weil `main` die Liste als Objekt modelliert hat und nicht als nacktes
Array. `nextCursor` ist ein neues Feld in einem bestehenden Objekt; wer es nicht
kennt, übersieht es. Wäre die Antwort ein Array gewesen, hätte die Paginierung sie
ersetzen müssen, und das ist ein Bruch.

Die ausführliche Begründung samt Alternativen steht in
[`docs/design.md`](docs/design.md#eine-million-kunden).

## Die Stände

Du bist im Stand `01-paginierung`. Er baut auf `main` auf – jeder Stand
ergänzt genau ein Thema, sodass der letzte die vollständige API zeigt. In der
Swagger UI schaltest Du oben links zwischen ihnen um.

| Stand | Was dazukommt | Ansehen | Diff |
| ----- | ------------- | ------- | ---- |
| [`main`](https://atvantage-academy.github.io/sample-customer-api/?spec=main) | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=main) · [YAML](../../blob/main/openapi.yaml) | – |
| `01-paginierung` **· Du bist hier** | Cursorbasiertes Blättern über die Kundenliste | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) · [YAML](../../blob/01-paginierung/openapi.yaml) | [PR #2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
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
