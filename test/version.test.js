// Which build is loaded must be visible: on the extensions page (the manifest's version), on every
// MyAnimeList page (an attribute the live check reads) and on the settings page (the owner,
// 12 Nov 2026: "number versions so that we know when one is loaded correctly").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { manifest, readExt, page, tick } from './helpers.js';

// A stand-in for the browser's extension API: an empty storage area and the manifest.
function fakeChrome() {
  const data = {};
  return {
    runtime: { getManifest: () => manifest() },
    storage: {
      local: {
        get: async (key) => (key in data ? { [key]: data[key] } : {}),
        set: async (obj) => Object.assign(data, obj),
        remove: async (key) => delete data[key],
      },
      onChanged: { addListener: () => {} },
    },
  };
}

test('the manifest version is three numbers, as the browser requires', () => {
  assert.match(manifest().version, /^\d+\.\d+\.\d+$/);
});

test('a MyAnimeList page carries the loaded version on <html>', async () => {
  const win = page('<p>nothing to hide</p>');
  win.chrome = fakeChrome();
  win.eval(readExt('content.js'));
  await tick();
  assert.equal(win.document.documentElement.getAttribute('data-msh-version'), manifest().version);
});

test('the settings page shows the loaded version', async () => {
  const html = readExt('options.html').replace(/<script src="[^"]+"><\/script>/g, '');
  const dom = new JSDOM(html, { url: 'https://example.invalid/options.html', runScripts: 'outside-only' });
  dom.window.chrome = fakeChrome();
  dom.window.eval(readExt('settings.js'));
  dom.window.eval(readExt('options.js'));
  await tick();
  assert.match(dom.window.document.body.textContent, new RegExp(`Version ${manifest().version.replace(/\./g, '\\.')}`));
});
