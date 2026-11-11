// Loads the extension's content scripts into a jsdom window, the way Chrome loads them into a page.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const EXT = new URL('../extension/', import.meta.url);
export const readExt = (file) => readFileSync(new URL(file, EXT), 'utf8');
export const manifest = () => JSON.parse(readExt('manifest.json'));

// The content scripts, in the order the manifest lists them.
const contentScripts = () => manifest().content_scripts[0].js.filter((f) => f !== 'content.js');

export function page(body, { url = 'https://myanimelist.net/anime/5114/Example' } = {}) {
  const css = manifest().content_scripts[0].css.map(readExt).join('\n');
  const dom = new JSDOM(
    `<!doctype html><html><head><style>${css}</style></head><body>${body}</body></html>`,
    { url, runScripts: 'outside-only', pretendToBeVisual: true },
  );
  for (const f of contentScripts()) dom.window.eval(readExt(f));
  // Mutation check: MSH_DROP_RULE=<name> runs the suite without one rule, which some test must catch.
  const drop = process.env.MSH_DROP_RULE;
  if (drop) dom.window.MSH.rules = dom.window.MSH.rules.filter((r) => r.name !== drop);
  return dom.window;
}

// A stand-in for chrome.storage: settings and remembered shows, with a hook to change settings.
export function fakeStore(settings = {}, revealed = []) {
  const store = {
    settings,
    revealed: new Set(revealed),
    listeners: [],
    load: async () => ({ settings: store.settings, revealed: [...store.revealed] }),
    remember: (id) => store.revealed.add(id),
    onSettings: (cb) => store.listeners.push(cb),
    change(next) {
      store.settings = next;
      for (const cb of store.listeners) cb(next);
    },
  };
  return store;
}

export async function start(win, store = fakeStore()) {
  const handle = win.MSH.start(win.document, store);
  await handle.ready;
  return handle;
}

// Is this node, or any element holding it, hidden by the extension?
export function isHidden(node) {
  const el = node.nodeType === 1 ? node : node.parentElement;
  return !!el.closest('[data-msh-h]');
}

// The text a reader sees: text nodes not inside a hidden element, whitespace collapsed.
export function visibleText(win, root = win.document.body) {
  const out = [];
  const walk = win.document.createTreeWalker(root, win.NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.data.trim() || isHidden(n)) continue;
    const el = n.parentElement;
    if (el.closest('script, style, [hidden]')) continue;
    if (el.closest('[style*="display: none"], [style*="display:none"]')) continue;
    out.push(n.data.trim());
  }
  return out.join(' ').replace(/\s+/g, ' ');
}

export const q = (win, sel) => win.document.querySelector(sel);
export const qa = (win, sel) => [...win.document.querySelectorAll(sel)];

export function click(win, el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }));
}

// Lets MutationObserver callbacks run.
export const tick = () => new Promise((r) => setTimeout(r, 0));
