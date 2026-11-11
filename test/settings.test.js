// The settings page's choices and their defaults: D3-D7 (11 Nov 2026), the answers given then.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from './helpers.js';

const MSH = () => page('').MSH;
// The objects come from the page's realm; compare them as plain data.
const plain = (o) => JSON.parse(JSON.stringify(o));

test('the defaults are the answers to D3-D7', () => {
  assert.deepEqual(plain(MSH().defaults()), {
    hideCounts: true,
    revealScope: 'one',
    autoReveal: 'rated',
    hideDistribution: true,
    hideReviewRating: false,
  });
});

test('every setting names its decision, a label and a valid default', () => {
  for (const s of MSH().SETTINGS) {
    assert.match(s.decision, /^D\d+$/, s.key);
    assert.ok(s.label.length > 0, s.key);
    if (s.type === 'boolean') assert.equal(typeof s.default, 'boolean', s.key);
    else assert.ok(s.choices.some(([v]) => v === s.default), s.key);
  }
});

test('stored values that are missing or not allowed fall back to the default', () => {
  const m = MSH();
  const got = m.normalize({ hideCounts: 'yes', revealScope: 'page', autoReveal: 'sometimes', extra: 1 });
  assert.deepEqual(plain(got), { ...plain(m.defaults()), revealScope: 'page' });
  assert.deepEqual(plain(m.normalize(undefined)), plain(m.defaults()));
});

test('settings and remembered shows are kept in chrome.storage.local, never sync', async () => {
  const area = () => {
    const data = {};
    return {
      data,
      get: async (k) => (k in data ? { [k]: data[k] } : {}),
      set: async (o) => Object.assign(data, o),
      remove: async (k) => delete data[k],
    };
  };
  const chrome = { storage: { local: area(), onChanged: { addListener() {} } } };
  Object.defineProperty(chrome.storage, 'sync', { get: () => assert.fail('storage.sync was used') });
  const store = MSH().chromeStore(chrome);
  await store.save({ hideCounts: false });
  await store.remember('anime:5114');
  const got = await store.load();
  assert.equal(got.settings.hideCounts, false);
  assert.deepEqual([...got.revealed], ['anime:5114']);
});
