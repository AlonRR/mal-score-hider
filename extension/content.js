// Entry point on every MyAnimeList page, run at document_start after settings.js, rules.js, core.js.
(function (g) {
  'use strict';
  const MSH = g.MSH;
  if (!MSH || MSH.running) return;
  MSH.running = true;
  const chrome = g.chrome;
  const store = chrome?.storage?.local ? MSH.chromeStore(chrome) : MSH.memoryStore();
  MSH.start(document, store);
})(globalThis);
