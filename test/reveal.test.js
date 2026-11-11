// How a hidden score comes back: a deliberate click only, never the mouse passing over it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, start, fakeStore, visibleText, isHidden, click, q, qa, tick } from './helpers.js';
import * as F from './fixtures.js';

const headerScore = (win) => q(win, '.stats-block .score-label');
const sidebarScore = (win) => q(win, '.js-statistics-info .score-label');

test('hovering or moving the mouse over a hidden score does not reveal it', async () => {
  const win = page(F.entry());
  await start(win);
  const el = headerScore(win);
  for (const type of ['mouseover', 'mouseenter', 'mousemove', 'pointerover', 'pointermove', 'focus']) {
    el.dispatchEvent(new win.MouseEvent(type, { bubbles: true }));
  }
  assert.ok(isHidden(el));
});

test('a click on one hidden score shows that score only (D4 a)', async () => {
  const win = page(F.entry());
  await start(win);
  click(win, headerScore(win));
  assert.ok(!isHidden(headerScore(win)));
  assert.ok(!q(win, 'div.fl-l.score').hasAttribute('data-msh-ha'), 'the user count stayed hidden');
  assert.ok(isHidden(sidebarScore(win)), 'the sidebar score was revealed too');
  assert.ok(isHidden(q(win, '.stats-block .ranked strong')), 'the rank was revealed too');
});

test('a click on the sidebar score shows it with its scored-by count', async () => {
  const win = page(F.entry());
  await start(win);
  click(win, sidebarScore(win));
  assert.match(visibleText(win, q(win, '.js-statistics-info')), /9\.11.*scored by.*2,353,020 users/s);
});

test('the click that reveals is not passed on to the page (a score inside a link does not navigate)', async () => {
  const win = page(F.entry());
  await start(win);
  const el = headerScore(win);
  const ev = new win.MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
  assert.ok(ev.defaultPrevented);
  const again = new win.MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(again);
  assert.ok(!again.defaultPrevented, 'a click on an already shown score should behave normally');
});

test('with "every score on the page", one click shows them all, including ones loaded later', async () => {
  const win = page(F.entry());
  await start(win, fakeStore({ revealScope: 'page' }));
  click(win, headerScore(win));
  assert.ok(!isHidden(sidebarScore(win)));
  assert.ok(!isHidden(q(win, '.stats-block .ranked strong')));
  const pop = win.document.createElement('div');
  pop.className = 'hoverinfo';
  pop.innerHTML = F.hoverPopup;
  q(win, '.rightside').append(pop);
  await tick();
  assert.match(visibleText(win, pop), /9\.07/);
});

test('the distribution button shows the table', async () => {
  const win = page(F.stats, { url: 'https://myanimelist.net/anime/5114/Example/stats' });
  await start(win);
  click(win, q(win, 'button[data-msh-block]'));
  assert.ok(!isHidden(q(win, 'table.score-stats')));
  assert.ok(q(win, 'button[data-msh-block]').hidden);
});

test('an entry you have scored shows its own scores, but not other shows in popups (D5 a)', async () => {
  const win = page(F.entry({ myScore: '10' }));
  await start(win);
  assert.ok(!isHidden(headerScore(win)));
  assert.ok(!isHidden(sidebarScore(win)));
  assert.ok(!isHidden(q(win, '.stats-block .ranked strong')));
  const pop = win.document.createElement('div');
  pop.className = 'hoverinfo';
  pop.innerHTML = F.hoverPopup;
  q(win, '.rightside').append(pop);
  await tick();
  assert.ok(!/9\.07/.test(visibleText(win, pop)), 'another show’s popup was revealed');
});

test('scoring the entry on its page shows its community score', async () => {
  const win = page(F.entry());
  await start(win);
  const select = q(win, '#myinfo_score');
  select.value = '9';
  select.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.ok(!isHidden(headerScore(win)));
});

test('with "keep hidden", a scored entry stays hidden (D5 b)', async () => {
  const win = page(F.entry({ myScore: '10' }));
  await start(win, fakeStore({ autoReveal: 'never' }));
  assert.ok(isHidden(headerScore(win)));
});

test('with "remember", a revealed show stays revealed on the next page load (D5 c)', async () => {
  const store = fakeStore({ autoReveal: 'remembered' });
  const win = page(F.entry());
  await start(win, store);
  click(win, headerScore(win));
  await tick();
  assert.deepEqual([...store.revealed], ['anime:5114']);

  const next = page(F.topAnime, { url: 'https://myanimelist.net/topanime.php' });
  await start(next, store);
  const [first, second] = qa(next, 'td.score .score-label');
  assert.ok(isHidden(first), 'show 52991 was never revealed');
  assert.ok(!isHidden(second), 'show 5114 was revealed before and should stay so');
});

test('settings: showing popularity and members (D3 off) leaves them visible', async () => {
  const win = page(F.entry());
  await start(win, fakeStore({ hideCounts: false }));
  const text = visibleText(win);
  assert.match(text, /#3/);
  assert.match(text, /3,754,732/);
  assert.ok(!text.includes('9.11'));
});

test('settings: hiding review ratings (D7 on) hides them', async () => {
  const win = page(F.entry());
  await start(win, fakeStore({ hideReviewRating: true }));
  assert.ok(isHidden(q(win, '.review-element .rating .num')));
});

test('settings: showing the distribution (D6 off) leaves the table and no button', async () => {
  const win = page(F.stats, { url: 'https://myanimelist.net/anime/5114/Example/stats' });
  await start(win, fakeStore({ hideDistribution: false }));
  assert.ok(!isHidden(q(win, 'table.score-stats')));
  const button = q(win, 'button[data-msh-block]');
  assert.ok(!button || button.hidden);
});

test('settings changed while a page is open apply at once, both ways', async () => {
  const store = fakeStore();
  const win = page(F.entry());
  await start(win, store);
  assert.ok(!visibleText(win).includes('3,754,732'));
  store.change({ hideCounts: false });
  assert.ok(visibleText(win).includes('3,754,732'));
  store.change({ hideCounts: true });
  assert.ok(!visibleText(win).includes('3,754,732'));
});

test('before the settings load, everything is hidden (it fails closed)', async () => {
  const win = page(F.entry());
  let release;
  const store = fakeStore({ hideCounts: false, hideReviewRating: false });
  store.load = () => new Promise((r) => { release = () => r({ settings: store.settings, revealed: [] }); });
  const handle = win.MSH.start(win.document, store);
  assert.ok(isHidden(q(win, '.review-element .rating .num')));
  assert.ok(!win.document.documentElement.hasAttribute('data-msh-ready'));
  release();
  await handle.ready;
  assert.ok(!isHidden(q(win, '.review-element .rating .num')));
  assert.ok(win.document.documentElement.hasAttribute('data-msh-ready'));
});

test('if the settings cannot be read, the defaults apply and the page still becomes ready', async () => {
  const win = page(F.entry());
  const store = fakeStore();
  store.load = () => Promise.reject(new Error('storage unavailable'));
  await start(win, store);
  assert.ok(win.document.documentElement.hasAttribute('data-msh-ready'));
  assert.ok(isHidden(headerScore(win)));
});

test('an element MAL takes out and puts back (a re-sort) can still be clicked', async () => {
  const win = page(F.seasonal, { url: 'https://myanimelist.net/anime/season' });
  const handle = await start(win);
  const list = q(win, '.seasonal-anime-list');
  const [first, second] = qa(win, '.seasonal-anime');
  first.remove();
  await tick();
  handle.scan();
  list.append(first); // the re-sort puts it back last
  await tick();
  const score = first.querySelector('.scormem-item.score');
  assert.ok(isHidden(score), 'the re-attached score is visible');
  click(win, score);
  assert.ok(!isHidden(score), 'the re-attached score cannot be revealed');
  assert.ok(isHidden(second.querySelector('.scormem-item.score')));
});
