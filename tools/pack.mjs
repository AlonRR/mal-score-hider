// Builds the file to upload to the stores: dist/score-hider-<version>.zip, holding exactly what is
// in extension/, with manifest.json at the zip's root. The same zip goes to both stores.
// Usage: npm run pack. It refuses to build while extension/ has changed since origin/main without
// a new version (tools/check-version.mjs), since a store refuses a version it already has.
// Entries carry a fixed date, so the same files always make the same zip.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const EXT = join(ROOT, 'extension');

function filesUnder(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? filesUnder(p) : [p];
    });
}

const DOS_TIME = 0; // 00:00:00
const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1 Jan 1980, the earliest a zip can say

export function pack(outDir = join(ROOT, 'dist')) {
  const version = JSON.parse(readFileSync(join(EXT, 'manifest.json'), 'utf8')).version;
  const locals = [];
  const central = [];
  let offset = 0;
  for (const path of filesUnder(EXT)) {
    const name = Buffer.from(relative(EXT, path).split(sep).join('/'), 'utf8');
    const data = readFileSync(path);
    const packed = deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4); // version needed: 2.0, deflate
    head.writeUInt16LE(0x0800, 6); // names are UTF-8
    head.writeUInt16LE(8, 8); // deflate
    head.writeUInt16LE(DOS_TIME, 10);
    head.writeUInt16LE(DOS_DATE, 12);
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(packed.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(name.length, 26);
    head.writeUInt16LE(0, 28);
    locals.push(head, name, packed);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4); // made by: 2.0
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(DOS_TIME, 12);
    dir.writeUInt16LE(DOS_DATE, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(packed.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(offset, 42); // disk, attributes and comment length stay 0
    central.push(dir, name);
    offset += head.length + name.length + packed.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, `score-hider-${version}.zip`);
  writeFileSync(out, Buffer.concat([...locals, centralBuf, end]));
  return out;
}

if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  execFileSync(process.execPath, [join(ROOT, 'tools', 'check-version.mjs')], { stdio: 'inherit' });
  const out = pack();
  console.log(`wrote ${relative(ROOT, out).split(sep).join('/')} (${statSync(out).size} bytes)`);
}
