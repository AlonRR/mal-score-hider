// Draws the add-on's icons and the store's logo and promo tile, and saves them as PNGs:
// extension/icons/icon-{16,32,48,128}.png, store/logo-300.png, store/promo-440x280.png.
// Usage: node tools/store-images.mjs. Needs Edge or Chrome (tools/edge.mjs). The PNGs are committed,
// so building the add-on never needs this; run it again only when the design below changes.
//
// The icon: a gold rating star with a spoiler bar across it, on an indigo tile. Sizes follow the
// Chrome Web Store's image guide (developer.chrome.com/docs/webstore/images): the 128 px icon is
// 96 px of artwork with 16 px of transparent padding a side; small icons fill more of their square
// so they stay legible in a toolbar.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { withEdge } from './edge.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

const COLORS = { tileTop: '#5146c9', tileBottom: '#2e2a86', star: '#ffcf4a', bar: '#17163a', barEdge: '#8f8ae6' };

// A five-pointed star around (cx, cy), point up.
function star(cx, cy, outer, inner) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// The artwork sits in the 96 px square at (16, 16) of a 128 px canvas; viewBox picks the padding.
function iconSvg(viewBox = '0 0 128 128') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${COLORS.tileTop}"/><stop offset="1" stop-color="${COLORS.tileBottom}"/>
  </linearGradient></defs>
  <rect x="16" y="16" width="96" height="96" rx="22" fill="url(#g)"/>
  <polygon points="${star(64, 66, 38, 16)}" fill="${COLORS.star}" stroke="${COLORS.star}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="22" y="58" width="84" height="22" rx="6" fill="${COLORS.bar}" stroke="${COLORS.barEdge}" stroke-width="1.5"/>
</svg>`;
}

const PADDED = '0 0 128 128'; // the store icon: 16 px padding a side
const SNUG = '12 12 104 104'; // toolbar sizes: about 4 px of padding at 128
const TIGHT = '15 15 98 98'; // 16 px: the tile fills the square

const page = (body, css = '') =>
  `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><style>
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
  ${css}</style></head><body>${body}</body></html>`)}`;

const promo = page(
  `<main><div class="icon">${iconSvg(SNUG)}</div><div class="text">
    <h1>Score Hider</h1><h2>for MyAnimeList</h2><p>Rate a show before<br>you see its score.</p></div></main>`,
  `main { width: 440px; height: 280px; box-sizing: border-box; padding: 0 30px; display: flex; align-items: center; gap: 22px;
    background: linear-gradient(160deg, ${COLORS.tileTop}, ${COLORS.tileBottom}); color: #fff;
    font-family: "Segoe UI", system-ui, sans-serif; }
  .icon { width: 140px; height: 140px; flex: none; }
  h1 { font-size: 36px; line-height: 1.05; margin: 0; font-weight: 700; letter-spacing: -0.01em; }
  h2 { font-size: 19px; margin: 4px 0 14px; font-weight: 600; color: #ffe08a; }
  p { font-size: 15px; line-height: 1.35; margin: 0; color: #dcdaf7; }`,
);

const JOBS = [
  ...[16, 32, 48, 128].map((s) => ({
    out: `extension/icons/icon-${s}.png`,
    w: s,
    h: s,
    url: page(iconSvg(s === 16 ? TIGHT : s === 128 ? PADDED : SNUG)),
  })),
  { out: 'store/logo-300.png', w: 300, h: 300, url: page(iconSvg(SNUG)) },
  { out: 'store/promo-440x280.png', w: 440, h: 280, url: promo },
];

mkdirSync(`${ROOT}extension/icons`, { recursive: true });
mkdirSync(`${ROOT}store`, { recursive: true });
await withEdge({}, async (browser) => {
  for (const j of JOBS) {
    const p = await browser.page(j.w, j.h, { transparent: true });
    await p.goto(j.url, 200);
    writeFileSync(`${ROOT}${j.out}`, await p.png());
    p.close();
    console.log(`wrote ${j.out} (${j.w}x${j.h})`);
  }
});
