// Takes the store screenshots (1280x800, the size both stores take) with the real add-on loaded in
// a headless Edge on a throwaway profile, signed out, so no account name is in any of them.
// Usage: node tools/store-shots.mjs. Writes store/screenshots/*.png; it loads a few public
// MyAnimeList pages, as a visitor would. Needs Edge or Chrome (tools/edge.mjs).
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withEdge, sleep } from './edge.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = `${ROOT}store/screenshots`;
const W = 1280;
const H = 800;
const SHOW = 'https://myanimelist.net/anime/5114'; // the page the survey measured (docs/survey.md)

// Fails the run if the add-on did not hide anything, so a broken build cannot make a clean shot.
async function hiddenCount(p) {
  const n = await p.eval(`document.querySelectorAll('[data-msh-anchor][data-msh-h]').length`);
  if (!n) throw new Error(`nothing hidden on ${await p.eval('location.href')}: is the add-on loaded?`);
  return n;
}

// MyAnimeList's "Get started" tip for visitors covers the score box; a real click on its own
// close mark (in the tip's shadow root) shuts it.
async function closeTip(p) {
  const open = () => p.eval(`!!document.querySelector('mal-tooltip')?.shadowRoot?.querySelector('[part=tooltip]')?.checkVisibility()`);
  if (!(await open())) return;
  const r = await p.eval(`(() => { const b = document.querySelector('mal-tooltip').shadowRoot.querySelector('.close').getBoundingClientRect();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  await clickAt(p, r);
  if (await open()) throw new Error('the Get started tip is still open');
}

// MyAnimeList's content column, below its header, zoomed to the shot's width so the bars read
// after the stores shrink a screenshot to 640x400.
const COLUMN = { x: 110, y: 112, w: 1060 };

// A real click, through the browser's input pipeline, at the middle of the first match.
async function click(p, selector) {
  const r = await p.eval(`(() => { const e = document.querySelector(${JSON.stringify(selector)});
    if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
  if (!r) throw new Error(`nothing matches ${selector}`);
  await clickAt(p, r);
}

async function clickAt(p, { x, y }) {
  await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  for (const type of ['mousePressed', 'mouseReleased']) {
    await p.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
  await sleep(400);
}

mkdirSync(OUT, { recursive: true });
await withEdge({ extension: `${ROOT}extension` }, async (browser) => {
  const save = async (p, name, region) => {
    writeFileSync(`${OUT}/${name}`, await p.png(region));
    console.log(`wrote store/screenshots/${name}`);
  };

  // The content script's isolated world names the add-on's id, which the settings page needs.
  const p = await browser.page(W, H);
  let id;
  p.on((m) => {
    const o = m.method === 'Runtime.executionContextCreated' && m.params.context.origin;
    const hit = o && /^chrome-extension:\/\/([a-p]{32})/.exec(o);
    if (hit) id = hit[1];
  });

  await p.goto(SHOW, 3000);
  await closeTip(p);
  console.log(`show page: ${await hiddenCount(p)} hidden`);
  await save(p, '1-show-page.png', COLUMN);

  await click(p, '.stats-block .score-label');
  await save(p, '2-one-click-shows-one.png', COLUMN);

  await p.goto('https://myanimelist.net/topanime.php', 3000);
  await closeTip(p);
  console.log(`top anime: ${await hiddenCount(p)} hidden`);
  await save(p, '3-top-anime.png', COLUMN);

  if (!id) throw new Error("the add-on's id was not seen; is it loaded?");
  const s = await browser.page(W, H);
  await s.goto(`chrome-extension://${id}/options.html`, 500);
  // The settings open as a small popup; shown here as that card on a plain backdrop.
  await s.eval(`(() => { const st = document.createElement('style'); st.textContent =
    'html { background: #121217; } body { margin: 56px auto; border-radius: 10px; box-shadow: 0 0 0 1px #3a3a42, 0 6px 28px #0008; zoom: 1.25; }';
    document.head.append(st); })()`);
  await sleep(300);
  await save(s, '4-settings.png');
});
