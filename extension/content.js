// Entry point on every MyAnimeList page, run at document_start after settings.js, rules.js, core.js.
(function (g) {
  'use strict';
  const MSH = g.MSH;
  if (!MSH || MSH.running) return;
  MSH.running = true;
  const chrome = g.chrome;
  // Which build is loaded, for the live check (tools/visible-scores.js).
  const version = chrome?.runtime?.getManifest?.().version;
  if (version) document.documentElement.setAttribute('data-msh-version', version);
  const store = chrome?.storage?.local ? MSH.chromeStore(chrome) : MSH.memoryStore();
  MSH.start(document, store);
})(globalThis);
