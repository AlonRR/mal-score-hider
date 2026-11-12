// A hidden score is drawn as a spoiler bar, the way chat apps hide spoilers (the owner, 12 Nov
// 2026): a solid bar in the text's own colour, no text and no blur, a tooltip that says a click
// shows it, and a dotted underline left after the reveal to mark what was a spoiler.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, start, click, q, qa, readExt } from './helpers.js';
import * as F from './fixtures.js';

const TIP = 'Spoiler: click to show';
const headerScore = (win) => q(win, '.stats-block .score-label');

test('a hidden score says, on hover, that a click shows it', async () => {
  const win = page(F.entry());
  await start(win);
  const anchors = qa(win, '[data-msh-anchor][data-msh-h]');
  assert.ok(anchors.length > 0);
  for (const a of anchors) assert.equal(a.getAttribute('title'), TIP);
});

test('once shown, the tooltip goes', async () => {
  const win = page(F.entry());
  await start(win);
  click(win, headerScore(win));
  assert.equal(headerScore(win).getAttribute('title'), null);
});

test('a title MyAnimeList set itself is kept, hidden or shown', async () => {
  const html = F.entry().replace('<div class="score-label score-9">', '<div title="theirs" class="score-label score-9">');
  assert.notEqual(html, F.entry(), 'the fixture changed; the header score was not found');
  const win = page(html);
  await start(win);
  assert.equal(headerScore(win).getAttribute('title'), 'theirs');
  click(win, headerScore(win));
  assert.equal(headerScore(win).getAttribute('title'), 'theirs');
});

test('the bar says "Spoiler", the same word on every bar (the owner, 12 Nov 2026)', () => {
  const css = readExt('hider.css');
  const rule = css.match(/\[data-msh-h\]\[data-msh-anchor\]::before\s*\{([^}]*)\}/);
  assert.ok(rule, 'the bar rule is missing');
  assert.match(rule[1], /content:\s*('Spoiler'|"Spoiler")/);
  // A word too long for a narrow bar is cut at its end ("Spoi"), never centred into "poile".
  assert.match(rule[1], /justify-content:\s*safe center/);
  assert.doesNotMatch(css, /attr\(data-msh-ph\)/);
});

test('the bar is one width whatever the number, so it gives away no digits (#2 and #4,000 alike)', async () => {
  const win = page(F.entry());
  await start(win);
  const inline = qa(win, 'span[data-msh-anchor][data-msh-h], strong[data-msh-anchor][data-msh-h]');
  assert.ok(inline.length >= 4, `only ${inline.length} inline bars`);
  const widths = new Set(inline.map((el) => win.getComputedStyle(el).width));
  assert.equal(widths.size, 1, `bars of several widths: ${[...widths]}`);
  assert.notEqual([...widths][0], 'auto');
  const shown = inline[0];
  click(win, shown);
  assert.notEqual(win.getComputedStyle(shown).width, [...widths][0], 'a shown number keeps the bar width');
});

test('a spoiler you clicked keeps a mark that it was one', async () => {
  const css = readExt('hider.css');
  assert.match(css, /\[data-msh-shown\]:not\(\[data-msh-h\]\)\s*\{[^}]*text-decoration[^}]*dotted/);
  const win = page(F.entry());
  await start(win);
  click(win, headerScore(win));
  assert.ok(headerScore(win).hasAttribute('data-msh-shown'));
  assert.ok(!q(win, '.stats-block .ranked strong').hasAttribute('data-msh-shown'), 'an unclicked one is marked');
});

test('a score shown because you scored the show (D5) is not marked as a spoiler', async () => {
  const win = page(F.entry({ myScore: '10' }));
  await start(win);
  assert.ok(!headerScore(win).hasAttribute('data-msh-h'), 'the fixture should show it (D5)');
  assert.equal(qa(win, '[data-msh-shown]').length, 0);
});
