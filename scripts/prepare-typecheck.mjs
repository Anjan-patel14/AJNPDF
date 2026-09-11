import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const stale = [
  'tsconfig.tsbuildinfo',
  '.tsbuildinfo',
];
for (const name of stale) {
  fs.rmSync(path.join(root, name), { force: true });
}
console.log('PASS: stale TypeScript incremental cache cleared before Next route type generation.');
