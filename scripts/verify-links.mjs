import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
};
walk(path.join(root, 'src'));

const normalizeRoute = (relative) => {
  const pieces = relative.split('/').filter(Boolean).filter((piece) => !(piece.startsWith('(') && piece.endsWith(')')));
  return `/${pieces.join('/')}`.replace(/\/$/, '') || '/';
};

const routes = new Set(['/']);
for (const file of files.filter((file) => file.endsWith(`${path.sep}page.tsx`))) {
  const relative = file.replace(path.join(root, 'src', 'app'), '').replace(`${path.sep}page.tsx`, '').split(path.sep).join('/');
  const route = normalizeRoute(relative);
  if (!route.includes('[')) routes.add(route);
}

const tools = fs.readFileSync(path.join(root, 'src/lib/tools-data.ts'), 'utf8');
const conversionTools = fs.readFileSync(path.join(root, 'src/lib/conversion-tools.ts'), 'utf8');
const toolIds = new Set([
  ...[...tools.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]),
  ...[...conversionTools.matchAll(/tool\('([^']+)'/g)].map((match) => match[1])]);

const errors = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/href=["'](\/[A-Za-z0-9_\-\/\[\].]+)["']/g)) {
    const href = match[1].replace(/\/$/, '') || '/';
    if (href.startsWith('/tools/')) {
      errors.push(`${path.relative(root, file)} still publishes legacy tool URL ${href}`);
      continue;
    }
    if (href.includes('[')) continue;
    const first = href.split('/').filter(Boolean)[0];
    if (first && toolIds.has(first) && href === `/${first}`) continue;
    if (!routes.has(href)) errors.push(`${path.relative(root, file)} links to missing route ${href}`);
  }
}

if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exit(1);
}
console.log(`PASS: ${routes.size} static routes, root tool routes and literal internal links are consistent.`);
