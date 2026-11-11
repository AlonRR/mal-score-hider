// A scan runs on every batch of page changes, so it must stay cheap on the largest pages: the
// seasonal page has about 185 tiles (docs/survey.md). jsdom is slower than Chrome, so this is an
// upper bound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, start, isHidden, qa } from './helpers.js';

const tile = (i) => `
<div class="seasonal-anime js-seasonal-anime">
  <div class="title"><a href="https://myanimelist.net/anime/${i}/T">Tile ${i}</a></div>
  <div class="scormem-container">
    <div class="scormem-item score score-label score-8"><i></i>8.${String(i % 100).padStart(2, '0')}</div>
    <div class="scormem-item member"><i></i>${i}K</div>
  </div>
</div>`;

test('a rescan of a 200-tile page, once marked, takes under 50 ms', async () => {
  const win = page(`<div>${Array.from({ length: 200 }, (_, i) => tile(i + 1)).join('')}</div>`, {
    url: 'https://myanimelist.net/anime/season',
  });
  const handle = await start(win);
  assert.ok(qa(win, '.scormem-item').every(isHidden));
  const runs = 5;
  const t0 = performance.now();
  for (let i = 0; i < runs; i++) handle.scan();
  const each = (performance.now() - t0) / runs;
  assert.ok(each < 50, `a rescan took ${each.toFixed(1)} ms`);
});
