// The repo's rules that a reader can check without running anything (CLAUDE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { manifest, readExt } from './helpers.js';

test('the manifest asks for the MyAnimeList site and storage, nothing else', () => {
  const m = manifest();
  assert.equal(m.manifest_version, 3);
  assert.deepEqual(m.permissions, ['storage']);
  assert.equal(m.host_permissions, undefined);
  assert.equal(m.optional_permissions, undefined);
  assert.equal(m.optional_host_permissions, undefined);
  assert.equal(m.background, undefined);
  assert.equal(m.web_accessible_resources, undefined);
  assert.equal(m.content_scripts.length, 1);
  assert.deepEqual(m.content_scripts[0].matches, ['https://myanimelist.net/*']);
  assert.equal(m.content_scripts[0].run_at, 'document_start');
});

test('every file the manifest names exists', () => {
  const files = new Set(readdirSync(new URL('../extension/', import.meta.url)));
  const m = manifest();
  const named = [...m.content_scripts[0].js, ...m.content_scripts[0].css, m.options_ui.page, m.action.default_popup];
  for (const f of named) assert.ok(files.has(f), `${f} is missing`);
});

test('no extension source makes a network request', () => {
  const dir = new URL('../extension/', import.meta.url);
  const banned = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(|new\s+Image\s*\(|https?:\/\/(?!myanimelist\.net)/;
  for (const f of readdirSync(dir).filter((f) => /\.(js|html|css)$/.test(f))) {
    assert.doesNotMatch(readExt(f), banned, f);
  }
});
