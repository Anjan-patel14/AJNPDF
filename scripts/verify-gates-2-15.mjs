import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const full = process.argv.includes('--full');
const started = new Date();
const report = {
  started: started.toISOString(),
  mode: full ? 'full' : 'source',
  gates: [],
};

const gates = [
  {
    id: 2,
    name: 'PDF Tool Functionality',
    commands: [
      'node scripts/verify-r24-public-tools.mjs',
      'node scripts/verify-browser-image-pdf.mjs',
      'node scripts/verify-r13-browser-pdf-acceptance.mjs',
      ...(full ? ['npm run test:editor'] : []),
    ],
  },
  {
    id: 3,
    name: 'Technical SEO & Indexing',
    commands: [
      'node scripts/generate-sitemap-lastmod.mjs',
      'node scripts/verify-sitemap-indexing.mjs',
    ],
  },
  {
    id: 4,
    name: 'Tool-Level SEO',
    commands: [
      'node scripts/verify-r20-focused-seo.mjs',
      'node scripts/verify-professional-seo.mjs',
    ],
  },
  {
    id: 5,
    name: 'SEO Page Content',
    commands: [
      'node scripts/verify-r21-product-ecosystem.mjs',
    ],
  },
  {
    id: 6,
    name: 'Internal Linking & SEO Architecture',
    commands: [
      'node scripts/verify-links.mjs',
    ],
  },
  {
    id: 7,
    name: 'Structured Data / Rich Results',
    commands: [
      'node scripts/verify-professional-seo.mjs',
    ],
  },
  {
    id: 8,
    name: 'Performance & Core Web Vitals Readiness',
    commands: [
      'node scripts/verify-current-performance.mjs',
      ...(full ? ['npm run build'] : []),
    ],
  },
  {
    id: 9,
    name: 'Mobile UI & Accessibility',
    commands: [
      'node scripts/verify-mobile-first.mjs',
      'node scripts/verify-accessibility.mjs',
      'node scripts/verify-i18n.mjs',
    ],
  },
  {
    id: 10,
    name: 'Security, Privacy & Trust',
    commands: [
      'node scripts/verify-dependency-policy.mjs',
      'node scripts/secret-scan.mjs',
      'node scripts/verify-r18-production-readiness.mjs',
      'node scripts/verify-r17-trust-seo.mjs',
    ],
  },
  {
    id: 11,
    name: 'Backend & Reliability',
    commands: [
      'node scripts/verify-r16-consistency.mjs',
      'node scripts/verify-backend-workflow.mjs',
      'node scripts/verify-capability-manifest.mjs',
      'node scripts/verify-r20-conversion-accuracy.mjs',
    ],
  },
  {
    id: 12,
    name: 'Analytics & Search Measurement',
    commands: [
      'node scripts/verify-current-analytics.mjs',
    ],
  },
  {
    id: 13,
    name: 'Google/Bing Search Readiness',
    commands: [
      'node scripts/verify-sitemap-indexing.mjs',
    ],
  },
  {
    id: 14,
    name: 'Content & Long-Tail Search Growth',
    commands: [
      'node scripts/verify-seo-growth-v2.mjs',
    ],
  },
  {
    id: 15,
    name: 'Final Production Acceptance',
    commands: [
      'node scripts/generate-r19-release-inventory.mjs',
      'node scripts/verify-r19-release.mjs',
      'node scripts/verify-tool-ux.mjs',
      'node scripts/verify-final-ui.mjs',
      ...(full ? [
        'npm run lint',
        'npm run typecheck',
        'npm run test:editor:production',
        'npm run verify:r13-runtime',
      ] : []),
    ],
  },
];

function run(command) {
  const result = spawnSync(command, {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  });
  return result.status ?? 1;
}

let failed = false;
for (const gate of gates) {
  console.log(`\n============================================================`);
  console.log(` GATE ${gate.id} :: ${gate.name}`);
  console.log(`============================================================`);
  const item = { id: gate.id, name: gate.name, commands: [], pass: true };
  for (const command of gate.commands) {
    console.log(`\n> ${command}`);
    const status = run(command);
    item.commands.push({ command, status });
    if (status !== 0) {
      item.pass = false;
      failed = true;
      console.error(`GATE ${gate.id} COMMAND FAILED: ${command}`);
      break;
    }
  }
  console.log(`${item.pass ? 'PASS' : 'FAIL'}: GATE ${gate.id} ${gate.name}`);
  report.gates.push(item);
}

report.finished = new Date().toISOString();
report.pass = !failed;
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'AJN_GATES_2_15_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`\n============================================================`);
console.log(` AJN PDF GATES 2-15 :: ${failed ? 'FAIL' : 'PASS'}`);
console.log(` Mode: ${full ? 'FULL' : 'SOURCE'}`);
console.log(` Report: reports/AJN_GATES_2_15_REPORT.json`);
console.log(`============================================================`);

if (failed) process.exit(1);
