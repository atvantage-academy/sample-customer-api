---
# Siehe https://github.com/agentsmd/agents.md
description: Musterlösung Account Service API – Aufbau, Pipeline, Stände und Arbeitsregeln
---

# Kontext

Dieses Repository ist die **Musterlösung** zur Entwurfsübung aus dem Training
„REST APIs – Grundlagen und Design“ der ATVANTAGE Academy. Es beschreibt eine
Schnittstelle und **implementiert sie nicht** – es gibt keinen Server, keinen
Code, keine Tests. Was hier liegt, ist ein Entwurf und seine Begründung.

Das zugehörige Schulungskonzept liegt in einem eigenen Repository
(`training-concept-api-engineering`, GHE) und verlinkt von dort auf die Stände
dieser Musterlösung. **Ändert sich hier ein Branchname oder eine Adresse, sind
dort die Module `openapi`, `best-practices` und `hypermedia-und-hal`
mitzuziehen.**

# Aufbau

```
openapi.yaml             Die API als OpenAPI 3.1 – das Hauptartefakt
docs/design.md           Der formlose Entwurf mit den Begründungen und Alternativen
redocly.yaml             Regeln für `redocly lint`, mit Begründung je Ausnahme
web/                     Die Oberfläche der veröffentlichten Swagger UI
  index.html               Seitengerüst
  topbar.css               Die eigene Leiste (ATVANTAGE-Marke, Stand-Auswahl)
  swagger-theme.css        Angleichung der Swagger UI an das Academy-Design
  topbar.js                Lädt specs.json, baut die Auswahl, schaltet um
  logo-atvantage.svg       Wortmarke aus dem ATVANTAGE-Design-System
  favicon.svg              Platzhalter-Icon
.github/workflows/
  spec-check.yml           Prüft die openapi.yaml EINES Branches
  pages.yml                Baut ALLE Stände und veröffentlicht sie
```

Es gibt **kein** `site/` im Repository – die Seite entsteht in der Pipeline.

# Die Pipeline

Zwei Workflows, und die Aufteilung hat einen Grund:

- **`OpenAPI prüfen` (`spec-check.yml`)** läuft auf jedem Push, auf jedem Branch.
  Er lintet nur die `openapi.yaml` dieses einen Branches.
- **`Swagger UI` (`pages.yml`)** sammelt aus **allen** Stand-Branches die
  `openapi.yaml` ein, legt sie unter `site/specs/<branch>/` ab, erzeugt
  `site/specs.json` und veröffentlicht das Ganze mit einer Swagger UI.

**Warum zwei?** Die Pages-Umgebung lässt Deployments üblicherweise nur vom
Standard-Branch zu. Ein Push auf `03-hypermedia-hal` dürfte also nicht selbst
veröffentlichen. `pages.yml` hängt sich deshalb per `workflow_run` an
`spec-check.yml` – und ein `workflow_run` läuft **immer** im Kontext des
Standard-Branches. So aktualisiert sich die Seite auch bei Änderungen an einem
Stand, ohne dass an Repository-Einstellungen gedreht werden muss.

Weiteres zur Pipeline:

- **Swagger UI kommt zur Build-Zeit aus npm**, gepinnt in einer Zeile
  (`SWAGGER_UI_VERSION`). Sie liegt bewusst nicht im Repository.
- **Das Standalone-Preset wird nicht ausgeliefert.** Es bringt nur die
  mitgelieferte Topbar mit SmartBear-Logo und einem Eingabefeld für beliebige
  fremde Beschreibungen. Unsere Leiste steht in `web/`.
- **Welche Branches ein Stand sind**, entscheidet `STAND_PATTERN` in `pages.yml`:
  `main` und zweistellig nummerierte Branches. Feature-Branches bleiben draußen.
- **Beschriftung und Kurztext** der Stand-Auswahl liest die Pipeline aus
  `info.x-stand-label` und `info.summary` des jeweiligen Dokuments. Ein neuer
  Stand beschriftet sich damit selbst.
- Die Oberfläche liegt als **richtige Datei** unter `web/`, nicht als
  Here-Dokument im Workflow – damit sie lokal ansehbar und in einem Diff lesbar
  ist.

# Die Stände

Die Musterlösung liegt in **fünf Branches**, die aufeinander aufbauen. Jeder
ergänzt genau ein Thema des Kurses, sodass der letzte die vollständige API zeigt:

```
main ──► 01-paginierung ──► 02-problem-details ──► 03-hypermedia-hal ──► 04-autorisierung
```

| Branch | Inhalt | Pull Request |
| ------ | ------ | ------------ |
| `main` | Der Kern: Ressourcen, Methoden, Statuscodes, Schemas | – |
| `01-paginierung` | Cursorbasiertes Blättern | [#2](https://github.com/atvantage-academy/sample-customer-api/pull/2) |
| `02-problem-details` | Fehlerformat nach RFC 9457 | [#3](https://github.com/atvantage-academy/sample-customer-api/pull/3) |
| `03-hypermedia-hal` | HAL, zustandsabhängige Verweise | [#4](https://github.com/atvantage-academy/sample-customer-api/pull/4) |
| `04-autorisierung` | OAuth 2, Scopes, `401`/`403` | [#5](https://github.com/atvantage-academy/sample-customer-api/pull/5) |

**Die Pull Requests bleiben offen und werden NIE gemergt.** Sie sind das
eigentliche Lehrmaterial: Jeder steht gegen seinen Vorgänger und zeigt Zeile für
Zeile, was ein einzelnes Thema an einer fertigen API verändert. Wer einen davon
mergt, zerstört genau das. In der Beschreibung jedes Pull Requests steht, worauf
beim Lesen zu achten ist – wird der Branch geändert, gehört sie mitgezogen.

# Arbeitsregeln für die Stände

Diese drei Regeln halten die Diffs lesbar. Sie sind der Zweck des Repositories,
nicht Kosmetik:

1. **Pro Branch genau ein Commit.** Änderungen an einem Stand werden in dessen
   bestehenden Commit **gesquasht**, nicht angehängt. Sonst zerfällt der Diff in
   eine Historie, die niemanden interessiert.
2. **Ändert sich `main`, werden alle Stände rebased** – der Reihe nach, jeder auf
   seinen Vorgänger. Ohne das wandern die `main`-Änderungen in die Diffs der
   Stände und verdecken das Thema.
3. **Nach dem Rebase force-pushen** (`--force-with-lease`). Die Pull Requests
   ziehen automatisch nach.

Der Ablauf nach einer Änderung an `main` – die alten Spitzen vorher notieren,
`--onto` braucht sie:

```sh
git rebase --onto main               <alte-spitze-main>  01-paginierung
git rebase --onto 01-paginierung     <alte-spitze-01>    02-problem-details
git rebase --onto 02-problem-details <alte-spitze-02>    03-hypermedia-hal
git rebase --onto 03-hypermedia-hal  <alte-spitze-03>    04-autorisierung
git push --force-with-lease origin 01-paginierung 02-problem-details \
                                   03-hypermedia-hal 04-autorisierung
```

**Ohne `--onto` geht es schief:** Ein schlichtes `git rebase 01-paginierung`
spielt auch den alten Commit des Vorgängers noch einmal ein, weil sich dessen
Commit-Kennung beim eigenen Rebase geändert hat.

Konflikte entstehen dabei regelmäßig in `README.md` und `docs/design.md`, weil
jeder Stand dort dieselben Abschnitte trägt. Sie werden aufgelöst, indem die
Fassung des Branches genommen und die Stand-Tabellen danach neu erzeugt werden.

# Bekannte Werkzeug-Eigenheit: `$ref` in `parameters`

Swagger UI löst bei **OpenAPI 3.1** kein `$ref` in den `parameters` **auf
Pfadebene** auf – die Oberfläche zeigt dann `any` statt Name und Typ. Mit
`openapi: 3.0.3` funktioniert dasselbe Dokument, auf Operationsebene funktioniert
der `$ref` auch unter 3.1 (geprüft mit swagger-ui-dist 5.32 und 5.33).

Deshalb steht der `customerId`-Parameter an **jeder** Operation statt einmal am
Pfad. Das ist ein Zugeständnis an ein Werkzeug, keine Entwurfsentscheidung; es
ist in `openapi.yaml` bei `components/parameters` ausführlich begründet und über
jedem Eintrag kurz vermerkt. **Nicht „aufräumen“**, ohne vorher zu prüfen, ob
Swagger UI es inzwischen kann.

# Tonalität

Dieses Repository ist **Schulungsmaterial**, kein Produktivcode. Daraus folgt:

- **Kommentare erklären das Warum**, nicht das Was. Eine Zeile, die sagt, was
  ohnehin dasteht, kann weg; eine, die eine verworfene Alternative benennt, nicht.
- **Keine Absolutheiten.** Wo mehrere Lösungen vertretbar sind – und das ist der
  Normalfall –, stehen sie nebeneinander, mit den Kriterien. Der Entwurf zeichnet
  keine als „richtig“ aus.
- **Fachbegriffe englisch belassen** (Resource, Header, Payload, Cursor), die
  Erklärung drumherum deutsch.
- **Kein Implementierungsbeispiel.** Der Kurs ist sprach- und frameworkneutral;
  gezeigter Code ist HTTP, JSON und YAML.
