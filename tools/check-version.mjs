// Fails when extension/ differs from a git ref but the manifest version was not raised, so every
// build that can be loaded has its own number. Run before each commit: `npm run check-version`
// (compares with origin/main), or `node tools/check-version.mjs <ref>`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ref = process.argv[2] || 'origin/main';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });

const changed = git('diff', '--name-only', ref, '--', 'extension/').trim();
const untracked = git('ls-files', '--others', '--exclude-standard', '--', 'extension/').trim();
const files = [changed, untracked].filter(Boolean).join('\n');

const now = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url), 'utf8')).version;
const before = JSON.parse(git('show', `${ref}:extension/manifest.json`)).version;

const parts = (v) => v.split('.').map(Number);
const greater = (a, b) => {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

if (!files) {
  console.log(`extension/ unchanged since ${ref}; version ${now}.`);
} else if (greater(now, before)) {
  console.log(`extension/ changed since ${ref}; version raised ${before} -> ${now}.`);
} else {
  console.error(`extension/ changed since ${ref} but the version is still ${now} (was ${before}).`);
  console.error('Raise "version" in extension/manifest.json. Changed:\n' + files);
  process.exit(1);
}
