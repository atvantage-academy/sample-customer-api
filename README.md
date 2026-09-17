# Musterlösung: Account Service API — 04 · Autorisierung

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

Der **letzte** Stand – hier ist die API vollständig. Jede Operation sagt, welche
Berechtigung sie verlangt, und kann mit `401` oder `403` antworten.

| | `03-hypermedia-hal` | `04-autorisierung` |
| --- | --- | --- |
| Security | keine | OAuth 2, Authorization Code |
| Voreinstellung | – | `reader_access` für alles |
| Antworten | 2xx, 400, 404, 409 | zusätzlich **401** und **403** an allen 21 Operationen |
| Prüfregel | `security-defined: off` | wieder eingeschaltet |

### Die vier Berechtigungen

| Scope | Erlaubt |
| ----- | ------- |
| `reader_access` | Kundendaten lesen |
| `writer_access` | Kundendaten anlegen, ändern, löschen; deaktivieren und wieder aktivieren |
| `payment_access` | Bezahldaten lesen und ändern |
| `lock_access` | Konten sperren und entsperren |

**`lock_access` ist bewusst von `writer_access` getrennt.** Die Sperre gehört dem
Betreiber, nicht dem Kundenservice – wer Namen korrigieren darf, darf deshalb noch
lange nicht sperren.

### `401` und `403` – der Unterschied

| Code | Heißt | Hilft ein zweiter Versuch? |
| ---- | ----- | -------------------------- |
| `401` Unauthorized | *Ich weiß nicht, wer Du bist.* Kein Token, abgelaufen, ungültig. | Ja – mit gültigem Token. |
| `403` Forbidden | *Ich weiß, wer Du bist, und Du darfst das nicht.* | Nein – nicht mit diesem Token. |

`401` ist eine Frage nach dem Ausweis, `403` eine Ablehnung trotz Ausweis. Der
Name von `401` ist historisch falsch – gemeint ist *unauthenticated*. Deshalb
werden die beiden so zuverlässig verwechselt.

### Und hier zahlt sich der Ressourcenschnitt aus

Wären die Bezahldaten **Felder des Kunden**, müsste `payment_access` auf Feldebene
greifen: „`GET /customers/{id}` darf jeder, aber die Felder `paypal` und
`creditcard` nur mit zusätzlicher Berechtigung.“ **Das kann HTTP nicht** –
Berechtigungen hängen an Adressen, nicht an Feldern.

Als eigene Subressource ist die Regel trivial, und ein Gateway kann sie
durchsetzen, ohne den Body zu kennen. Genau deshalb wurde am ersten Kurstag so
geschnitten, auch wenn der Grund damals noch nicht auf dem Tisch lag.

### Was hier nicht steht

Wie Tokens ausgestellt, geprüft und erneuert werden. Wie Scopes vergeben werden.
Rate Limiting, mTLS, Schlüsselrotation. **API Security ist ein eigener Kurs**,
kein Kapitel – hier steht nur, was der Entwurf davon wissen muss.

Ausführlich in [`docs/design.md`](docs/design.md#wer-darf-was).

## Die Stände

Du bist im Stand `04-autorisierung`. Er baut auf `03-hypermedia-hal` auf – jeder Stand
ergänzt genau ein Thema, sodass der letzte die vollständige API zeigt. In der
Swagger UI schaltest Du oben links zwischen ihnen um.

| Stand | Was dazukommt | Ansehen | Diff |
| ----- | ------------- | ------- | ---- |
| [`main`](https://atvantage-academy.github.io/sample-customer-api/?spec=main) | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=main) · [YAML](../../blob/main/openapi.yaml) | – |
| [`01-paginierung`](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) | Cursorbasiertes Blättern über die Kundenliste | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=01-paginierung) · [YAML](../../blob/01-paginierung/openapi.yaml) | [PR #2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
| [`02-problem-details`](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) | Fehlerformat nach RFC 9457 statt des eigenen | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=02-problem-details) · [YAML](../../blob/02-problem-details/openapi.yaml) | [PR #3](https://github.com/atvantage-academy/sample-customer-api/pull/3) |
| [`03-hypermedia-hal`](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) | HAL: Die Antwort trägt ihre nächsten Schritte mit | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=03-hypermedia-hal) · [YAML](../../blob/03-hypermedia-hal/openapi.yaml) | [PR #4](https://github.com/atvantage-academy/sample-customer-api/pull/4) |
| `04-autorisierung` **· Du bist hier** | OAuth 2, Scopes, `401` und `403` | [Swagger UI](https://atvantage-academy.github.io/sample-customer-api/?spec=04-autorisierung) · [YAML](../../blob/04-autorisierung/openapi.yaml) | [PR #5](https://github.com/atvantage-academy/sample-customer-api/pull/5) |

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
