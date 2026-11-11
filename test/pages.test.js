// What is hidden on each page type, with the defaults (dub-queue's D83 and this repo's D1-D8, 11 Nov 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, start, fakeStore, visibleText, isHidden, q, qa, tick } from './helpers.js';
import * as F from './fixtures.js';

const SCORE = /\b\d{1,2}\.\d{2}\b/;

test('entry page: score, scored-by count, rank, popularity and members are hidden', async () => {
  const win = page(F.entry());
  // Known positives: the fixture shows them before the extension runs.
  assert.match(visibleText(win), /9\.11.*2,353,020 users.*#2.*#3.*3,754,732/s);
  await start(win);
  const text = visibleText(win);
  for (const gone of ['9.11', '2,353,020', 'scored by', '#2', '#3', '3,754,732']) {
    assert.ok(!text.includes(gone), `"${gone}" still visible in: ${text}`);
  }
  // The labels stay, so the reader knows what is behind the placeholder.
  for (const kept of ['Score:', 'Ranked:', 'Popularity:', 'Members:', 'Ranked', 'Popularity', 'Members']) {
    assert.ok(text.includes(kept), `label "${kept}" was hidden`);
  }
});

test('entry page: the score box user count, drawn by ::after, is hidden with it', async () => {
  const win = page(F.entry());
  await start(win);
  assert.ok(q(win, 'div.fl-l.score').hasAttribute('data-msh-ha'));
});

test('entry page: the owner’s own score control is left alone', async () => {
  const win = page(F.entry());
  await start(win);
  assert.ok(!isHidden(q(win, '#myinfo_score')));
});

test('entry page: the Favorites count is hidden with the other counts (D9)', async () => {
  const win = page(F.entry());
  assert.match(visibleText(win), /Favorites: 230,001/);
  await start(win);
  const text = visibleText(win);
  assert.ok(!text.includes('230,001'), `Favorites count still visible in: ${text}`);
  assert.match(text, /Favorites:/);
});

test('entry page: a review’s rating stays visible by default (D7)', async () => {
  const win = page(F.entry());
  await start(win);
  assert.ok(!isHidden(q(win, '.review-element .rating .num')));
});

test('hover popup loaded after the page: score, rank and counts are hidden', async () => {
  const win = page(F.entry());
  await start(win);
  const pop = win.document.createElement('div');
  pop.className = 'hoverinfo';
  q(win, '.rightside').append(pop);
  pop.innerHTML = F.hoverPopup;
  await tick();
  const text = visibleText(win, pop);
  assert.ok(!SCORE.test(text), text);
  for (const gone of ['1,500,000', '#3', '#13', '2,868,458']) assert.ok(!text.includes(gone), `"${gone}" in ${text}`);
  assert.match(text, /Type: TV/);
});

test('stats tab: the score distribution is hidden behind one button (D6)', async () => {
  const win = page(F.stats, { url: 'https://myanimelist.net/anime/5114/Example/stats' });
  await start(win);
  assert.ok(isHidden(q(win, 'table.score-stats')));
  const button = q(win, 'button[data-msh-block]');
  assert.ok(button && !button.hidden, 'no button in place of the distribution');
});

test('top anime: the score column is hidden, Your Score and the rank column are not', async () => {
  const win = page(F.topAnime, { url: 'https://myanimelist.net/topanime.php' });
  await start(win, fakeStore({ autoReveal: 'never' }));
  for (const el of qa(win, 'td.score .score-label')) assert.ok(isHidden(el));
  for (const el of qa(win, 'tr.ranking-list td.your-score')) assert.ok(!isHidden(el.querySelector('.score-label')));
  for (const el of qa(win, '.top-anime-rank-text')) assert.ok(!isHidden(el));
  const text = visibleText(win);
  assert.ok(!text.includes('9.24') && !text.includes('9.11'), text);
  assert.ok(!text.includes('1,543,101') && !text.includes('3,755,276'), text);
  assert.match(text, /members/, 'the word "members" should stay beside the hidden count');
});

test('top anime: a show you have scored shows its community score (D5 a)', async () => {
  const win = page(F.topAnime, { url: 'https://myanimelist.net/topanime.php' });
  await start(win);
  const [rated, unrated] = qa(win, 'td.score .score-label');
  assert.ok(!isHidden(rated), 'the scored show (Your Score 10) is still hidden');
  assert.ok(isHidden(unrated), 'the unscored show (N/A) was revealed');
});

test('seasonal and genre tiles: score and member count are hidden', async () => {
  const win = page(F.seasonal, { url: 'https://myanimelist.net/anime/season' });
  await start(win);
  const text = visibleText(win);
  for (const gone of ['8.61', '7.05', '1.2M', '310K']) assert.ok(!text.includes(gone), `"${gone}" in ${text}`);
});

test('studio and producer tiles: score and user count are hidden', async () => {
  const win = page(F.producer, { url: 'https://myanimelist.net/anime/producer/4/Studio' });
  await start(win);
  const text = visibleText(win);
  assert.ok(!text.includes('9.11') && !text.includes('3,755,276'), text);
  assert.match(text, /Studio show/);
});

test('search and genre list view: the Score and Members columns are hidden, the others are not', async () => {
  const win = page(F.searchTable, { url: 'https://myanimelist.net/anime.php?q=x' });
  await start(win);
  const text = visibleText(win);
  assert.ok(!text.includes('9.11') && !text.includes('3,755,276'), text);
  assert.match(text, /Score/, 'the column header was hidden');
  assert.match(text, /TV 64/, 'the Type and Eps. columns were hidden');
});

test('search, all categories: the number after "Scored" and the member count are hidden', async () => {
  const win = page(F.searchAll, { url: 'https://myanimelist.net/search/all?q=x' });
  await start(win);
  const text = visibleText(win);
  assert.ok(!text.includes('9.11') && !text.includes('3,755,276'), text);
  assert.match(text, /Scored/);
  assert.match(text, /members/);
});

test('manga entry pages are covered the same way (D2)', async () => {
  const win = page(F.entry(), { url: 'https://myanimelist.net/manga/2/Example' });
  await start(win);
  assert.ok(!visibleText(win).includes('9.11'));
});

test('a page that streams in after the script starts is hidden as it arrives', async () => {
  const win = page('', { url: F.ENTRY_URL });
  const handle = win.MSH.start(win.document, fakeStore());
  win.document.body.innerHTML = F.entry();
  await tick();
  await handle.ready;
  assert.ok(!visibleText(win).includes('9.11'));
});

test('a line whose number arrives after its label joins the same hidden unit', async () => {
  const win = page('<div class="leftside"><div class="spaceit_pad"><span class="dark_text">Members:</span></div></div>');
  await start(win);
  const line = q(win, '.spaceit_pad');
  line.append(win.document.createTextNode(' 3,754,732 '));
  await tick();
  assert.ok(!visibleText(win).includes('3,754,732'));
  assert.equal(qa(win, '[data-msh-anchor]').length, 1, 'expected one placeholder for the line');
});

test('scanning twice wraps nothing twice', async () => {
  const win = page(F.entry());
  const handle = await start(win);
  const before = win.document.body.innerHTML;
  handle.scan();
  assert.equal(win.document.body.innerHTML, before);
});

test('the Advanced Search form, whose rows include "Score", is left alone', async () => {
  const win = page(F.advancedSearch + F.searchTable, { url: 'https://myanimelist.net/anime/genre/1/Action' });
  await start(win);
  assert.equal(qa(win, '#advancedSearch [data-msh-unit]').length, 0, 'a filter label or control was marked');
  assert.match(visibleText(win, q(win, '#advancedSearch')), /Type .*Score .*Status .*Producer/s);
  assert.ok(!visibleText(win).includes('9.11'), 'the real score column is no longer hidden');
});

test('home page: rank, popularity, score and members in the list-updates box and ranking widgets', async () => {
  const win = page(F.home, { url: 'https://myanimelist.net/' });
  await start(win);
  const text = visibleText(win);
  for (const gone of ['#8441', '2464', '9.03', '256,661']) assert.ok(!text.includes(gone), `"${gone}" in ${text}`);
  for (const kept of ['Ranked', 'Popularity', 'ONA, 0 eps, scored', 'members', 'Watching at 3 of 13']) {
    assert.ok(text.includes(kept), `"${kept}" was hidden`);
  }
});

test('a member count that belongs to no show (a club) is left alone', async () => {
  const win = page(F.home, { url: 'https://myanimelist.net/' });
  await start(win);
  assert.match(visibleText(win, q(win, '.club')), /29 Members/);
});
