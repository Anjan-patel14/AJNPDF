import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const manifestPath = path.join(root, 'BACKEND_UNCHANGED_SHA256.txt');

if (!fs.existsSync(manifestPath)) {
  console.error('AJN PDF BACKEND FROZEN CHECK: FAIL');
  console.error(' - BACKEND_UNCHANGED_SHA256.txt is missing');
  process.exit(1);
}

const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/);
const expected = new Map();
for (const line of lines) {
  const match = line.match(/^([a-f0-9]{64})\s{2}(backend\/.+)$/i);
  if (match) expected.set(match[2].replaceAll('\\', '/'), match[1].toLowerCase());
}

if (expected.size === 0) {
  console.error('AJN PDF BACKEND FROZEN CHECK: FAIL');
  console.error(' - No protected backend source files were found in the checksum manifest');
  process.exit(1);
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// All protected backend entries in the AJN PDF source baseline are text files.
// Windows Git can materialize CRLF while release packages use LF. A byte-only
// comparison therefore produces false changes on a correct checkout. Normalize
// only UTF-8 BOM and line endings; every other byte/content difference still fails.
function normalizedTextBytes(buffer) {
  if (buffer.includes(0)) return buffer; // defensive: never rewrite binary-like data
  let text = buffer.toString('utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return Buffer.from(text, 'utf8');
}

const failures = [];
for (const [rel, hash] of expected) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    failures.push(`Missing protected backend source file ${rel}`);
    continue;
  }
  const bytes = fs.readFileSync(full);
  const raw = sha256(bytes);
  const normalized = sha256(normalizedTextBytes(bytes));
  if (raw !== hash && normalized !== hash) {
    failures.push(`Changed protected backend source file ${rel} (raw=${raw.slice(0,12)} normalized=${normalized.slice(0,12)} expected=${hash.slice(0,12)})`);
  }
}

// Runtime-generated backend artifacts (.venv, tessdata, SQLite DBs, fixtures,
// __pycache__, etc.) are intentionally outside this protected source manifest.
if (failures.length) {
  console.error('AJN PDF BACKEND FROZEN CHECK: FAIL');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log(
  `AJN PDF BACKEND FROZEN CHECK: PASS (${expected.size} protected source files unchanged; Windows CRLF/BOM normalized; runtime artifacts ignored)`,
);
