// Before the extension is installed: one script that runs the content scripts inside an open
// MyAnimeList page (its console, or a browser tool), to try the rules on live markup.
// Usage: node tools/page-bundle.mjs > <file>. It runs after the page has loaded, so it shows
// the rules and late-content handling, not the document_start timing; the installed extension does.
import { readFileSync } from 'node:fs';
const ext = (f) => readFileSync(new URL(`../extension/${f}`, import.meta.url), 'utf8');
const m = JSON.parse(ext('manifest.json')).content_scripts[0];
const css = m.css.map(ext).join('\n');
process.stdout.write(
  `(() => { const s = new CSSStyleSheet(); s.replaceSync(${JSON.stringify(css)});\n` +
  `document.adoptedStyleSheets = [...document.adoptedStyleSheets, s]; })();\n` +
  m.js.map(ext).join('\n') + '\n"bundle loaded";\n',
);
