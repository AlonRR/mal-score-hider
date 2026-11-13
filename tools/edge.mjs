// Drives a headless Edge (or Chrome) through the DevTools protocol, for the store images: a fresh
// throwaway profile each run, so nothing is signed in and no account shows in a screenshot.
// The browser is found at EDGE, or else at its usual Windows install paths.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CANDIDATES = [
  process.env.EDGE,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One page's protocol connection: send(method, params) and the events it has seen.
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok, { once: true });
    ws.addEventListener('error', fail, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { ok, fail } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? fail(new Error(`${m.error.message} (${m.error.code})`)) : ok(m.result);
    } else if (m.method) for (const l of listeners) l(m);
  });
  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const i = ++id;
      pending.set(i, { ok, fail });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const once = (method, timeout = 30000) =>
    new Promise((ok, fail) => {
      const t = setTimeout(() => (listeners.delete(l), fail(new Error(`no ${method} in ${timeout} ms`))), timeout);
      const l = (m) => m.method === method && (clearTimeout(t), listeners.delete(l), ok(m.params));
      listeners.add(l);
    });
  return { send, once, on: (l) => listeners.add(l), close: () => ws.close() };
}

// Runs fn(browser) with a headless browser, the unpacked extension loaded if one is given, and
// always closes it and deletes the profile.
export async function withEdge({ extension } = {}, fn) {
  const exe = CANDIDATES.find((p) => existsSync(p));
  if (!exe) throw new Error('No Edge or Chrome found; set EDGE to the browser executable.');
  const profile = mkdtempSync(join(tmpdir(), 'msh-edge-'));
  const args = ['--headless=new', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--no-first-run', '--hide-scrollbars'];
  if (extension) args.push(`--load-extension=${extension}`, `--disable-extensions-except=${extension}`);
  const proc = spawn(exe, [...args, 'about:blank'], { stdio: 'ignore' });
  try {
    let port;
    for (let i = 0; i < 100 && !port; i++) {
      await sleep(100);
      const f = join(profile, 'DevToolsActivePort');
      if (existsSync(f)) port = readFileSync(f, 'utf8').split('\n')[0].trim() || undefined;
    }
    if (!port) throw new Error('The browser did not open its DevTools port.');
    const base = `http://127.0.0.1:${port}`;
    const browser = {
      // A new page of the given size, at one device pixel per CSS pixel.
      async page(width, height, { transparent = false } = {}) {
        const t = await (await fetch(`${base}/json/new?about:blank`, { method: 'PUT' })).json();
        const p = await connect(t.webSocketDebuggerUrl);
        await p.send('Page.enable');
        await p.send('Runtime.enable');
        await p.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
        if (transparent) await p.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
        p.goto = async (url, settle = 0) => {
          const loaded = p.once('Page.loadEventFired', 60000);
          await p.send('Page.navigate', { url });
          await loaded;
          if (settle) await sleep(settle);
        };
        p.eval = async (expression) => {
          const r = await p.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
          if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
          return r.result.value;
        };
        // The whole page, or a region of it (CSS pixels) drawn at the page's full width, re-rendered
        // at that scale rather than stretched, so text stays sharp.
        p.png = async ({ x = 0, y = 0, w = width } = {}) => {
          const scale = width / w;
          const clip = { x, y, width: w, height: height / scale, scale };
          return Buffer.from((await p.send('Page.captureScreenshot', { format: 'png', clip })).data, 'base64');
        };
        return p;
      },
    };
    return await fn(browser);
  } finally {
    proc.kill();
    for (let i = 0; i < 20; i++) {
      try {
        rmSync(profile, { recursive: true, force: true });
        break;
      } catch {
        await sleep(250); // the browser still holds its profile for a moment after it is told to quit
      }
    }
  }
}
