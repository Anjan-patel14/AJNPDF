import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
let issues = 0;
const pass = (message) => console.log(`PASS: ${message}`);
const fail = (message) => { issues += 1; console.error(`FAIL: ${message}`); };

const analytics = read('src/app/admin/analytics/page.tsx');
const unusedAnalyticsIcons = [
  'BarChart3', 'Clock3', 'Database', 'Download',
  'MousePointerClick', 'ImageIcon', 'Search', 'Sparkles'];
for (const icon of unusedAnalyticsIcons) {
  const importPattern = new RegExp(`\\n\\s*${icon},`);
  if (importPattern.test(analytics)) fail(`admin analytics still imports unused ${icon}`);
  else pass(`admin analytics does not import unused ${icon}`);
}

const imageToPdf = read('src/components/junction/ImageToPdfTool.tsx');
if (/function\s+ImageToPdfTool\s*\(\{[^}]*\bbadge\b[^}]*\}:\s*Props\)/s.test(imageToPdf)) {
  fail('ImageToPdfTool still destructures unused badge prop');
} else {
  pass('ImageToPdfTool preserves badge compatibility without unused destructuring');
}

if (issues) {
  console.error(`AJN PDF R10.4 ESLINT HOTFIX verification failed with ${issues} issue(s).`);
  process.exit(1);
}
console.log('AJN PDF R10.4 ESLINT ZERO-WARNING HOTFIX SOURCE AUDIT: PASS');
