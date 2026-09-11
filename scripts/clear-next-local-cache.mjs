import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
for (const name of ['.next', '.turbo', 'tsconfig.tsbuildinfo', '.tsbuildinfo']) {
  const target = path.join(root, name);
  fs.rmSync(target, { recursive: true, force: true });
}
console.log('PASS: local Next.js/TypeScript cache cleared (.next/.turbo/tsbuildinfo).');
