/* =============================================================================
   Staende umschalten - ATVANTAGE Academy
   -----------------------------------------------------------------------------
   `specs.json` wird von der Pages-Pipeline erzeugt und listet jeden Branch, der
   eine `openapi.yaml` hat. Diese Datei baut daraus das Auswahlfeld in der Leiste
   und laedt den gewaehlten Stand in die Swagger UI - ohne Seitenwechsel.

   Der gewaehlte Stand steht in der Adresse (`?spec=01-paginierung`). Deshalb
   laesst sich ein einzelner Stand verlinken, und genau das tun die READMEs und
   die Kursunterlagen.
   ============================================================================= */

(function () {
  'use strict';

  var select = document.getElementById('stand-select');
  var note = document.getElementById('stand-note');

  var SWAGGER_OPTIONS = {
    dom_id: '#swagger-ui',
    deepLinking: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
    // Hinter den Adressen steht kein Server - "Try it out" wuerde ins Leere
    // laufen und Lernende auf eine falsche Faehrte fuehren.
    tryItOutEnabled: false,
    supportedSubmitMethods: [],
    presets: [SwaggerUIBundle.presets.apis],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    // BaseLayout statt StandaloneLayout: Die Leiste oben ist unsere eigene.
    layout: 'BaseLayout'
  };

  function fail(message) {
    note.textContent = message;
    select.innerHTML = '';
    select.disabled = true;
  }

  function renderNote(repository, spec) {
    note.innerHTML = '';

    var text = document.createElement('span');
    text.className = 'stand-note__text';
    text.textContent = spec.summary || 'Kein Kurztext hinterlegt.';
    note.appendChild(text);

    if (repository) {
      var branchLink = document.createElement('a');
      branchLink.href = repository + '/tree/' + spec.branch;
      branchLink.rel = 'noopener';
      branchLink.textContent = 'Branch ' + spec.branch;
      note.appendChild(branchLink);
      note.appendChild(document.createTextNode(' · '));
    }

    var yamlLink = document.createElement('a');
    yamlLink.href = spec.url;
    yamlLink.textContent = 'openapi.yaml';
    note.appendChild(yamlLink);
  }

  function show(repository, spec, isFirst) {
    renderNote(repository, spec);
    document.title = spec.label + ' · Account Service API – Musterlösung der ATVANTAGE Academy';

    if (isFirst) {
      window.ui = SwaggerUIBundle(Object.assign({ url: spec.url }, SWAGGER_OPTIONS));
      return;
    }

    // Beschreibung im laufenden Betrieb austauschen. Genau so macht es auch die
    // mitgelieferte Leiste von Swagger UI. Geht das schief - etwa weil eine
    // kuenftige Version diese Aktionen umbenennt -, laedt die Seite neu; das
    // Ergebnis ist dasselbe, nur unruhiger.
    try {
      window.ui.specActions.updateUrl(spec.url);
      window.ui.specActions.download(spec.url);
    } catch (error) {
      window.location.search = '?spec=' + encodeURIComponent(spec.branch);
    }
  }

  fetch('specs.json', { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) { throw new Error('specs.json: HTTP ' + response.status); }
      return response.json();
    })
    .then(function (data) {
      var specs = (data && data.specs) || [];
      var repository = (data && data.repository) || '';

      if (specs.length === 0) {
        fail('Es wurde kein Stand gefunden. Die Pipeline hat keine openapi.yaml gefunden.');
        return;
      }

      var wanted = new URLSearchParams(window.location.search).get('spec');
      var current = specs.filter(function (s) { return s.branch === wanted; })[0] || specs[0];

      select.innerHTML = '';
      specs.forEach(function (spec) {
        var option = document.createElement('option');
        option.value = spec.branch;
        option.textContent = spec.label;
        option.selected = spec === current;
        select.appendChild(option);
      });

      // Ist nur ein Stand da, waere die Auswahl eine Attrappe.
      select.disabled = specs.length < 2;

      select.addEventListener('change', function () {
        var chosen = specs.filter(function (s) { return s.branch === select.value; })[0];
        if (!chosen) { return; }
        var url = new URL(window.location.href);
        url.searchParams.set('spec', chosen.branch);
        url.hash = '';
        window.history.replaceState(null, '', url);
        show(repository, chosen, false);
      });

      show(repository, current, true);
    })
    .catch(function (error) {
      fail('Die Liste der Stände ließ sich nicht laden: ' + error.message);
    });
})();
