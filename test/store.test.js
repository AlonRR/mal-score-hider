// What the two stores need from the upload and the listing (D18 (13 Nov 2026): Edge Add-ons and
// the Chrome Web Store). Each limit cites the store page it comes from, as read on 13 Nov 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { manifest, readExt } from './helpers.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const EXT = join(ROOT, 'extension');
const read = (p) => readFileSync(join(ROOT, p));

// A PNG's width and height, from its IHDR chunk.
function pngSize(buf) {
  assert.equal(buf.subarray(1, 4).toString('latin1'), 'PNG', 'not a PNG');
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function filesUnder(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

// The entries of a zip, read through its central directory, each inflated.
function unzip(buf) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= 0, 'no end of central directory');
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  const out = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(at), 0x02014b50, 'bad central directory entry');
    const method = buf.readUInt16LE(at + 10);
    const packed = buf.readUInt32LE(at + 20);
    const size = buf.readUInt32LE(at + 24);
    const nameLen = buf.readUInt16LE(at + 28);
    const extra = buf.readUInt16LE(at + 30);
    const comment = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.subarray(at + 46, at + 46 + nameLen).toString('utf8');
    const dataAt = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(dataAt, dataAt + packed);
    out.set(name, method === 8 ? inflateRawSync(data) : data);
    assert.equal(out.get(name).length, size, `${name}: wrong size`);
    at += 46 + nameLen + extra + comment;
  }
  return out;
}

// The listing text, by its "## " headings.
function listing() {
  const text = read('store/listing.md').toString('utf8');
  const parts = {};
  for (const m of text.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |(?![\s\S]))/gm)) parts[m[1].trim()] = m[2].trim();
  return parts;
}

const NAME = 'Score Hider for MyAnimeList';

test('the add-on is named for the site it works on, not as the site itself (D19 (13 Nov 2026))', () => {
  const m = manifest();
  assert.equal(m.name, NAME);
  assert.match(m.action.default_title, new RegExp(`^${NAME}`));
  const html = readExt('options.html');
  assert.match(html, new RegExp(`<title>${NAME}[^<]*</title>`));
  assert.match(html, new RegExp(`<h1>${NAME}</h1>`));
  assert.doesNotMatch(JSON.stringify(m) + html, /MAL score hider/);
});

test('the manifest description fits the 132 characters the browser allows', () => {
  assert.ok(manifest().description.length <= 132, `${manifest().description.length} characters`);
});

test('icons at 16, 32, 48 and 128 px, each the size it says (both stores need the 128)', () => {
  const m = manifest();
  for (const icons of [m.icons, m.action.default_icon]) {
    assert.deepEqual(Object.keys(icons).sort((a, b) => a - b), ['16', '32', '48', '128']);
    for (const [size, file] of Object.entries(icons)) {
      assert.deepEqual(pngSize(readFileSync(join(EXT, file))), [Number(size), Number(size)], file);
    }
  }
});

test('the listing images are the sizes the stores take', () => {
  // Edge: logo 1:1, 300 px recommended (learn.microsoft.com .../publish/publish-extension).
  assert.deepEqual(pngSize(read('store/logo-300.png')), [300, 300]);
  // Both: small promo tile 440x280 (developer.chrome.com/docs/webstore/images; Edge, as above).
  assert.deepEqual(pngSize(read('store/promo-440x280.png')), [440, 280]);
  // 1280x800 is the one screenshot size both accept; Chrome takes 1 to 5, Edge up to 6.
  const shots = readdirSync(join(ROOT, 'store', 'screenshots')).filter((f) => f.endsWith('.png'));
  assert.ok(shots.length >= 1 && shots.length <= 5, `${shots.length} screenshots`);
  for (const f of shots) assert.deepEqual(pngSize(read(`store/screenshots/${f}`)), [1280, 800], f);
});

test('the listing has every field the stores ask for, and names no browser', () => {
  const l = listing();
  for (const field of ['Short description', 'Description', 'Category', 'Single purpose', 'Permission: storage', 'Site access: myanimelist.net', 'Remote code', 'Data use']) {
    assert.ok(l[field], `listing.md has no "${field}"`);
  }
  assert.equal(l['Short description'], manifest().description, 'the short description is the manifest description');
  // Edge: 250 to 10,000 characters (publish-extension).
  assert.ok(l.Description.length >= 250 && l.Description.length <= 10000, `${l.Description.length} characters`);
  // Edge developer policy 1.1.2: a listing must not reference other browsers. One text serves both.
  for (const f of ['Short description', 'Description', 'Single purpose']) {
    assert.doesNotMatch(l[f], /\b(chrome|chromium|edge|firefox|opera|brave)\b/i, f);
  }
});

test('the privacy policy says nothing is collected or sent', () => {
  const p = read('PRIVACY.md').toString('utf8');
  assert.match(p, /collects no/i);
  assert.match(p, /no network requests/i);
});

test('the upload zip holds exactly extension/, manifest at its root', async () => {
  const { pack } = await import('../tools/pack.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'msh-pack-'));
  try {
    const zip = pack(dir);
    assert.match(zip, new RegExp(`${manifest().version.replace(/\./g, '\\.')}\\.zip$`));
    const entries = unzip(readFileSync(zip));
    const want = filesUnder(EXT).map((p) => relative(EXT, p).split(sep).join('/')).sort();
    assert.deepEqual([...entries.keys()].sort(), want);
    for (const name of want) assert.deepEqual(entries.get(name), readFileSync(join(EXT, name)), name);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
